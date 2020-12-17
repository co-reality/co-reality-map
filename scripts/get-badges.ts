#!/usr/bin/env node -r esm -r ts-node/register

import admin from "firebase-admin";
import { initFirebaseAdminApp } from "./lib/helpers";

const usage = () => {
  const scriptName = process.argv[1];
  const helpText = `
---------------------------------------------------------
${scriptName}: Get user details. Prints each user's email address, last seen time in milliseconds since epoch, and codes used.

Usage: node ${scriptName} PROJECT_ID VENUE_ID CREDENTIAL_PATH

Example: node ${scriptName} co-reality-map myawesomevenue prodAccountKey.json
---------------------------------------------------------
`;

  console.log(helpText);
  process.exit(1);
};

const [projectId] = process.argv.slice(2);
if (!projectId) {
  usage();
}

const [venueId] = process.argv.slice(2);
if (!venueId) {
  usage();
}

initFirebaseAdminApp(projectId, {
  appName: projectId,
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
    ["Email", "Party Name", "Entered Venues"]
      .map((heading) => `"${heading}"`)
      .join(",")
  );

  const firestoreUsers = await admin.firestore().collection("users").get();

  firestoreUsers.docs.forEach((doc) => {
    const user = allUsers.find((u) => u.uid === doc.id);
    const partyName = doc.data().partyName;
    const enteredVenues = doc.data().enteredVenuesIds;

    if (enteredVenues.includes(venueId)) {
      console.log(
        [user?.email ?? doc.id, partyName, enteredVenues]
          .map((v) => `"${v}"`)
          .join(",")
      );
    }
  });

  process.exit(0);
})();
