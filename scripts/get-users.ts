#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

import validCodes from "./validCodes.json";

const usage = makeScriptUsage({
  description:
    "Get user details. Prints each user's email address, last seen time in milliseconds since epoch, and codes used.",
  usageParams: "PROJECT_ID [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map [theMatchingAccountServiceKey.json]",
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
  const allUsers: admin.auth.UserRecord[] = [];
  let nextPageToken: string | undefined;
  const { users, pageToken } = await admin.auth().listUsers(1000);

  allUsers.push(...users);
  nextPageToken = pageToken;

  while (nextPageToken) {
    const { users, pageToken } = await admin
      .auth()
      .listUsers(1000, nextPageToken);
    allUsers.push(...users);
    nextPageToken = pageToken;
  }

  console.log(
    [
      "Email",
      "Party Name",
      "Account Creation",
      "Last Sign In",
      "Session Duration",
      "Account Lifetime Duration",
      "Codes Used",
      "Valid Codes Used",
      "Distinct Codes Used",
      "Valid Distinct Codes Used",
      "Invalid Distinct Codes Used",
      "Codes Used List",
    ]
      .map((heading) => `"${heading}"`)
      .join(",")
  );

  const firestoreUsers = await admin.firestore().collection("users").get();

  firestoreUsers.docs.forEach((doc) => {
    const user = allUsers.find((u) => u.uid === doc.id);
    const partyName = doc.data().partyName;
    const creationTime = new Date(user.metadata.creationTime).getTime();
    const lastSignInTime = new Date(user.metadata.lastSignInTime).getTime();
    const lastSeenAt = (doc.data().lastSeenAt || 0) * 1000;
    const sessionLengthDays =
      Math.max(0, lastSeenAt - lastSignInTime) / (3600 * 1000 * 24);
    const lifetimeDays =
      Math.max(0, lastSeenAt - creationTime) / (3600 * 1000 * 24);
    const codesUsed = doc.data().codes_used ?? [];
    const validCodesUsed = codesUsed.filter((code) =>
      validCodes.includes(code)
    );
    const distinctCodesUsed = codesUsed.filter((v, i, a) => a.indexOf(v) === i);
    const validDistincCodesUsed = validCodesUsed.filter(
      (v, i, a) => a.indexOf(v) === i
    );

    console.log(
      [
        user?.email ?? doc.id,
        partyName,
        new Date(creationTime).toISOString(),
        new Date(lastSignInTime).toISOString(),
        sessionLengthDays,
        lifetimeDays,
        codesUsed.length,
        validCodesUsed.length,
        distinctCodesUsed.length,
        validDistincCodesUsed.length,
        distinctCodesUsed.length - validDistincCodesUsed.length,
        codesUsed.join("\\,"),
      ]
        .map((v) => `"${v}"`)
        .join(",")
    );
  });

  process.exit(0);
})();
