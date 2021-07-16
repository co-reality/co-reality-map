#!/usr/bin/env node -r esm -r ts-node/register

import { resolve } from "path";

import admin from "firebase-admin";
import { writeToPath } from "@fast-csv/format";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Generate a CSV report of all users on the platform environment",
  usageParams: "PROJECT_ID CREDENTIAL_PATH",
  exampleParams: "co-reality-staging [theMatchingAccountServiceKey.json]",
});

const [projectId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId) {
  usage();
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  console.log("Loading all platform 'auth' users into memory...");

  // @debt Replace this with 'chunked user fetching' pattern from get-badges script, and don't iterate over all users on the platform.
  const allUsers: admin.auth.UserRecord[] = [];
  let nextPageToken: string | undefined;
  const { users, pageToken } = await admin.auth().listUsers(10);

  allUsers.push(...users);
  nextPageToken = pageToken;

  while (nextPageToken) {
    const { users, pageToken } = await admin
      .auth()
      .listUsers(1000, nextPageToken);
    allUsers.push(...users);
    nextPageToken = pageToken;
  }

  const headers = [
    "Email",
    "Party Name",
    "Full name",
    "Company title",
    "Company department",
    "Ask me about:",
    "I'm loving this song - book - show: ",
    "I've been at GitHub for:",
    "The best part of my role at GitHub is:",
    "When not working I'm often:",
    "Last Sign In",
  ];

  console.log("Loading all platform firebase user profiles into memory...");

  // @debt refactor this to only fetch users that have entered the venues we care about (similar to how get-badges works)
  const firestoreUsers = await admin.firestore().collection("users").get();

  console.log("Extracting data to be used to generate the CSV...");

  const rows = firestoreUsers.docs.map((doc) => {
    const user = allUsers.find((u) => u.uid === doc.id);

    const { partyName, realName, companyTitle, companyDepartment } = doc.data();

    // @debt handle reading questions in a less hacky way
    const Q1 = doc.data()[headers[5]];
    const Q2 = doc.data()[headers[6]];
    const Q3 = doc.data()[headers[7]];
    const Q4 = doc.data()[headers[8]];
    const Q5 = doc.data()[headers[9]];

    const lastSignInTime = new Date(doc.data().lastSeenAt).getTime();

    return [
      user?.email ?? doc.id,
      partyName,
      realName,
      companyTitle,
      companyDepartment,
      Q1,
      Q2,
      Q3,
      Q4,
      Q5,
      lastSignInTime ? new Date(lastSignInTime).toISOString() : "ٔٔNever",
    ];
  });

  const rowsWithHeaders = [headers, ...rows];

  const csvFilePath = resolve(
    __dirname,
    `users-report-${new Date().getTime()}.csv`
  );

  console.log("Writing CSV report to file...");

  await new Promise<void>((resolve, reject) => {
    writeToPath(csvFilePath, rowsWithHeaders)
      .on("error", (err) => reject(err))
      .on("finish", () => resolve());
  });

  console.log(`CSV report successfully generated: ${csvFilePath}`);
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
