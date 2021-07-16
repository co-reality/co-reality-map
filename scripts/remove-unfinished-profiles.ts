#!/usr/bin/env node -r esm -r ts-node/register

import { resolve } from "path";

import admin from "firebase-admin";

import {
  checkFileExists,
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

const usage = makeScriptUsage({
  description:
    "Bulk remove of user accounts that exist in the auth but are not in the firestore users collection",
  usageParams: "CREDENTIAL_PATH",
  exampleParams: "fooAccountKey.json",
});

const [credentialPath] = process.argv.slice(2);
if (!credentialPath) {
  usage();
}

if (!checkFileExists(credentialPath)) {
  console.error("Credential file path does not exists:", credentialPath);
  process.exit(1);
}

const { project_id: projectId } = parseCredentialFile(credentialPath);

if (!projectId) {
  console.error("Credential file has no project_id:", credentialPath);
  process.exit(1);
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const usersCollectionRef = admin.firestore().collection("users");

// 1000 is the maximum number of users firestore can fetch. check .listUsers()'s documentation for more information.
// It is also 1000 by default but I decided to set it explicitly to avoid confusion.
const MAX_USERS = 1000;

const getAuthUsers = async (maxUsers: number, pageToken?: string) =>
  await admin.auth().listUsers(maxUsers, pageToken);

(async () => {
  const totalAuthUsers: admin.auth.UserRecord[] = [];

  console.log("Fetching firestore auth users...");
  const { users: authUsers, pageToken } = await getAuthUsers(MAX_USERS);
  totalAuthUsers.push(...authUsers);

  // @debt This is going to make another request with offset if the maximum number of users have been returned by the previous request. This should be using recursion, because there might be more than 2k users.
  if (authUsers.length >= MAX_USERS) {
    console.log(
      `Auth users are more than ${MAX_USERS}. Fetching additional batch of firestore auth users...`
    );
    const { users: additionalAuthUsers } = await getAuthUsers(
      MAX_USERS,
      pageToken
    );
    totalAuthUsers.push(...additionalAuthUsers);
  }

  const userDocIds: string[] = await usersCollectionRef
    .get()
    .then((result) => {
      console.log("Firestore users successfully fetched.");
      return result.docs.map((doc) => doc.id);
    })
    .catch((err) => {
      console.error(
        "Failed when trying to fetch the users collection, skipping...",
        err
      );
      return [];
    });

  const unfinishedProfiles = totalAuthUsers
    .filter((user) => !userDocIds.includes(user.uid))
    .map((user) => user.uid);

  const numberOfUnfinishedProfiles = unfinishedProfiles.length;

  if (!numberOfUnfinishedProfiles) {
    console.log(
      "There are no unfinished profiles in the database, end of script."
    );
    return;
  }

  const numberOfProfiles =
    numberOfUnfinishedProfiles > MAX_USERS
      ? MAX_USERS
      : numberOfUnfinishedProfiles;

  console.log(`Deleting ${numberOfProfiles} users...`);

  await admin
    .auth()
    .deleteUsers(unfinishedProfiles)
    .then(async () => {
      console.log(`${numberOfProfiles} users have been successfuly deleted.`);
      const remainingUnfinishedProfiles = [...unfinishedProfiles].splice(
        0,
        MAX_USERS
      );
      const numberOfRemainingUnfinishedProfiles =
        remainingUnfinishedProfiles.length;
      if (numberOfRemainingUnfinishedProfiles) {
        console.log(`Deleting ${remainingUnfinishedProfiles} users...`);
        await admin
          .auth()
          .deleteUsers(remainingUnfinishedProfiles)
          .then(() => {
            console.log(
              `${remainingUnfinishedProfiles} users have been successfuly deleted.`
            );
          });
      }
    })
    .catch((err) => {
      console.error(
        "Failed when trying to delete the unfinished profiles, end of script.",
        err
      );
    });
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
