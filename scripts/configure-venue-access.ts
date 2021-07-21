#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import fs from "fs";
import admin from "firebase-admin";
import "firebase/firestore";

import { VenueAccessMode } from "../src/types/VenueAcccess";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Configures the venue access with the selected method and value",
  usageParams:
    "PROJECT_ID VENUE_ID [password|emaillist|codelist] [password | emails file path | codes file path] [CREDENTIAL_PATH]",
  exampleParams:
    "co-reality-map password abc123 [theMatchingAccountServiceKey.json] / co-reality-map emails emails-one-per-line.txt [theMatchingAccountServiceKey.json] / co-reality-map codes ticket-codes-one-per-line.txt [theMatchingAccountServiceKey.json]",
});

const [
  projectId,
  venueId,
  method,
  accessDetail,
  credentialPath,
] = process.argv.slice(2);
if (!projectId || !venueId || !method || !accessDetail) {
  usage();
}

if (!VenueAccessMode[method as keyof typeof VenueAccessMode]) {
  console.error(`Invalid access method ${method}`);
  process.exit(1);
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  console.log(`Ensuring ${venueId} access via ${method} - ${accessDetail}`);
  const venueDoc = await admin.firestore().doc(`venues/${venueId}`).get();
  if (!venueDoc.exists) {
    console.error(`venue ${venueId} does not exist`);
    process.exit(1);
  }

  await admin.firestore().doc(`venues/${venueId}`).update({ access: method });
  console.log("Done");

  console.log(`Configuring access details for ${method}...`);

  const accessDocRef = admin
    .firestore()
    .doc(`venues/${venueId}/access/${method}`);
  const accessDoc = await accessDocRef.get();
  const access = accessDoc.exists ? accessDoc.data() : {};

  switch (method) {
    case VenueAccessMode.Password:
      const password = accessDetail.trim();
      console.log(
        `Setting venues/${venueId}/access/${method} to {password: ${password}}...`
      );
      await accessDocRef.set({ password });
      break;

    case VenueAccessMode.Emails:
      const emails = fs
        .readFileSync(accessDetail, "utf-8")
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase());
      console.log(
        `Setting venues/${venueId}/access/${method} to {emails: ${emails}}...`
      );
      await accessDocRef.set(
        {
          emails: emails,
        },
        { merge: true }
      );
      break;

    case VenueAccessMode.Codes:
      const codes = fs
        .readFileSync(accessDetail, "utf-8")
        .split(/\r?\n/)
        .forEach((line) => {
          access?.codes?.push(line.trim());
        });
      console.log(`Setting venues/${venueId}/access/${method}...`);
      await accessDocRef.set(
        {
          codes: codes,
        },
        { merge: true }
      );
      break;
  }
  console.log("Done.");

  process.exit(0);
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
