#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Count documents at the second level of a Firestore collection.",
  usageParams: "PROJECT_ID COLLECTION [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map venues [theMatchingAccountServiceKey.json]",
});

const [projectId, collection, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !collection) {
  usage();
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  const topLevelDocs = await admin
    .firestore()
    .collection(collection)
    .listDocuments();

  console.log(`number of documents in ${collection}:`, topLevelDocs.length);

  let totalSecondLevelDocs = 0;
  await Promise.all(
    topLevelDocs.map(async (topLevelDoc) => {
      await Promise.all(
        (await topLevelDoc.listCollections()).map(async (collection) => {
          const secondLevelDocs = await collection.listDocuments();
          const count = secondLevelDocs.length;
          console.log("collection:", topLevelDoc.id, "has N docs:", count);
          totalSecondLevelDocs += count;
        })
      );
    })
  );
  console.log("total documents: ", totalSecondLevelDocs);
})();
