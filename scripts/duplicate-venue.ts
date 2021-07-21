#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Duplicate a venue within the same environment.",
  usageParams: "PROJECT_ID VENUE_ID TARGET_VENUE_ID [CREDENTIAL_PATH]",
  exampleParams:
    "co-reality-staging myspanishroom myenglishroom [theMatchingAccountServiceKey.json]",
});

const [
  projectId,
  sourceVenueId,
  destVenueId,
  credentialPath,
] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !sourceVenueId || !destVenueId) {
  usage();
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  const sourceVenue = await admin
    .firestore()
    .doc(`venues/${sourceVenueId}`)
    .get();

  if (!sourceVenue.exists) {
    console.error(`Venue ${sourceVenueId} does not exist; exiting`);
    process.exit(1);
  }

  console.log(`Got venue ${sourceVenueId}`);
  console.log(`Writing to ${destVenueId}...`);

  await admin
    .firestore()
    .doc(`venues/${destVenueId}`)
    .set(sourceVenue.data() ?? {});

  console.log("Done");
  process.exit(0);
})();
