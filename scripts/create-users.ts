#!/usr/bin/env node -r esm -r ts-node/register

import fs from "fs";
import admin from "firebase-admin";

import {
  checkFileExists,
  findUserByEmail,
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

import "firebase/firestore";

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const usage = makeScriptUsage({
  description: "Bulk register users based on the supplied email address(es).",
  usageParams: "CREDENTIAL_PATH EMAIL_FILE_PATH",
  exampleParams: "fooAccountKey.json foouser@example.com baruser@example.com",
});

const [credentialPath, emailListPath] = process.argv.slice(2);
if (!credentialPath) {
  usage();
}

if (!checkFileExists(credentialPath)) {
  console.error("Credential file path does not exists:", credentialPath);
  process.exit(1);
}

if (!checkFileExists(emailListPath)) {
  console.error("Email file path does not exists:", emailListPath);
  process.exit(1);
}

const { project_id: projectId } = parseCredentialFile(credentialPath);

if (!projectId) {
  console.error("Credential file has no project_id:", credentialPath);
  process.exit(1);
}

const app = initFirebaseAdminApp(projectId, { credentialPath });

(async () => {
  const usersToCreate = fs
    .readFileSync(emailListPath, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.split(","));

  for (const user of usersToCreate) {
    const [username, email, password, avatarImgSrc] = user;
    const existingUser = await findUserByEmail(app)(email);

    if (existingUser) {
      console.warn(`User already exists for ${email}, skipping..`);
      continue;
    }

    const createdUser = await app.auth().createUser({ email, password });

    await admin.firestore().collection("users").doc(createdUser.uid).set({
      partyName: username,
      pictureUrl: avatarImgSrc,
    });

    console.log(`User created: email=${email}, password=${password}`);
  }
})();
