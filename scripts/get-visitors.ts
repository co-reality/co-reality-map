#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import fs from "fs";
import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Print attendees' emails, based on codes_used.",
  usageParams: "PROJECT_ID [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map [theMatchingAccountServiceKey.json]",
});

const [projectId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId) {
  usage();
}

const CODES_FILE_PATH = "codes.txt";
const codes = fs
  .readFileSync(CODES_FILE_PATH)
  .toString()
  .split("\n")
  .map((line) => line.toLowerCase());

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  const userprivateCollection = await admin
    .firestore()
    .collection("userprivate")
    .get();

  const codesUsed: string[] = [];

  userprivateCollection.forEach((doc) => {
    if (!doc.exists || !doc.data().codes_used) return;
    doc.data().codes_used.map((c) => codesUsed.push(c));
  });

  const emailsWhoLoggedIn = codes.filter((code) => codesUsed.includes(code));

  console.log(
    `Email addresses of users who logged in (total ${emailsWhoLoggedIn.length}):`
  );

  emailsWhoLoggedIn.sort().forEach((e) => console.log(e));

  process.exit(0);
})();
