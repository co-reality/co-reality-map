#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Count the users that have entered the venue(s) specified.",
  usageParams: "PROJECT_ID VENUE_IDS [CREDENTIAL_PATH]",
  exampleParams:
    "co-reality-map venueId,venueId2,venueIdN [theMatchingAccountServiceKey.json]",
});

const [projectId, venueIds, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !venueIds) {
  usage();
}

const venueIdsArray = venueIds.split(",");

// Note: if we ever need to handle this, we can split our firestore query into 'chunks', each with 10 items per array-contains-any
if (venueIdsArray.length > 10) {
  console.error(
    "Error: This script can only handle up to 10 venueIds at once at the moment."
  );
  console.error("  venueIdsArray.length :", venueIdsArray.length);
  process.exit(1);
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  venueIdsArray.map(async (venueId) => {
    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("enteredVenueIds", "array-contains", venueId)
      .get();

    console.log(venueId, ":", snapshot.docs.length);
  });

  if (venueIdsArray.length > 1) {
    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("enteredVenueIds", "array-contains-any", venueIdsArray)
      .get();

    console.log(venueIds, "(combined): ", snapshot.docs.length);
  }
})();
