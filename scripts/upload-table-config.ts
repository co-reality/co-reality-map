#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { Table } from "../src/types/Table";
import { AnyVenue } from "../src/types/venues";

import { generateTables } from "../src/utils/table";

import {
  initFirebaseAdminApp,
  makeSaveToBackupFile,
  makeScriptUsage,
} from "./lib/helpers";

// ---------------------------------------------------------
// Configuration (this is the bit you should edit)
// ---------------------------------------------------------

const newTables: Table[] = [
  ...generateTables({ num: 5, capacity: 6 }),
  ...generateTables({ num: 5, capacity: 2, startFrom: 5, columns: 2 }),
];

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const usage = makeScriptUsage({
  description:
    "Generate/upload table config (from newTables const, edit the script)",
  usageParams: "PROJECT_ID VENUE_ID [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map myvenue [theMatchingAccountServiceKey.json]",
});

const [projectId, venueId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !venueId) {
  usage();
}

const saveToBackupFile = makeSaveToBackupFile(
  `${projectId}-upload-table-config`
);

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const asSingleTablePerLine = (table: Table) => JSON.stringify(table, null, 0);

const db = admin.firestore();

db.runTransaction(async (transaction) => {
  const docRef = db.doc(`venues/${venueId}`);

  const doc = await transaction.get(docRef);
  const venue = doc.data() as AnyVenue;
  if (!doc.exists || !venue) {
    console.error(`${venueId} venue does not exist`);
    process.exit(1);
  }

  if (!venue.config) {
    console.error(`${venueId} venue.config does not exist`);
    process.exit(1);
  }

  const oldTables = venue?.config?.tables || [];

  // Show the existing tables data
  console.log("Old Tables:\n", oldTables.map(asSingleTablePerLine));
  console.log("New Tables:\n", newTables.map(asSingleTablePerLine));

  // Save a backup of the current venue config just in case
  saveToBackupFile(venue, `venue-${venueId}`);
  saveToBackupFile(oldTables, `venue-${venueId}-oldTables`);
  saveToBackupFile(newTables, `venue-${venueId}-newTables`);

  return transaction.update(docRef, {
    "config.tables": newTables,
  });
})
  .then(() => {
    console.log("Transaction successfully committed!");
    process.exit(0);
  })
  .catch((error) => {
    console.log("Transaction failed: ", error);
    process.exit(1);
  });
