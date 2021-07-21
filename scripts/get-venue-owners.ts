#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Print venue owners' email addresses.",
  usageParams: "PROJECT_ID VENUE_ID [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map myvenue [theMatchingAccountServiceKey.json]",
});

const [projectId, venueId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !venueId) {
  usage();
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

(async () => {
  const { users, pageToken } = await admin.auth().listUsers(1000);

  const allUsers = [...users];
  let nextPageToken = pageToken;

  while (nextPageToken) {
    const { users, pageToken } = await admin
      .auth()
      .listUsers(1000, nextPageToken);
    allUsers.push(...users);
    nextPageToken = pageToken;
  }

  // @debt This function will currently load all venues in firebase into memory.. not very efficient
  const firestoreVenues = await admin.firestore().collection("venues").get();
  const venues = firestoreVenues.docs.filter(
    (doc) =>
      doc.exists &&
      (doc.id === venueId ||
        (doc.data().parentId && doc.data().parentId === venueId))
  );

  venues.forEach((doc) => {
    if (!doc.exists) return;

    // For all venues, print venue id and owners
    console.log(
      `Venue: ${doc.id} (${doc.data().name}) is owned by emails: ${doc
        .data()
        .owners.map((uid) => allUsers.find((u) => u.uid === uid)?.email ?? uid)
        .join(", ")}`
    );
  });

  process.exit(0);
})();
