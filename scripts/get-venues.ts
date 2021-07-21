#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Get venue details. Prints venue name, type and other details.",
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
      "Venue ID",
      "Venue Name",
      "Venue Type",
      "Tagline",
      "Long Description",
      "Zoom URL (if applicable)",
      "iframe URL (if applicable)",
      "Owner emails",
    ]
      .map((heading) => `"${heading}"`)
      .join(",")
  );

  // @debt This function will currently load all venues in firebase into memory.. not very efficient
  const firestoreVenues = await admin.firestore().collection("venues").get();

  firestoreVenues.docs.forEach((doc) => {
    const venueId = doc.id;
    const venueName = doc.data().name;
    const venueTemplate = doc.data().template;
    const tagline = doc.data().config?.landingPageConfig?.subtitle;
    const longDescription = doc.data().config?.landingPageConfig?.description;
    const zoomUrl = doc.data().zoomUrl ?? "";
    const iframeUrl = doc.data().iframeUrl ?? "";
    const ownerEmails = (doc.data().owners ?? []).map(
      (ownerUid: string) => allUsers?.find((u) => u.uid === ownerUid)?.email
    );

    console.log(
      [
        venueId,
        venueName,
        venueTemplate,
        tagline,
        longDescription,
        zoomUrl,
        iframeUrl,
        ownerEmails.join(","),
      ]
        .map(
          (v) =>
            `"${(v ?? "")
              .split('"')
              .join('\\"')
              .split(",")
              .join("\\,")
              .split("\n")
              .join(" ")}"`
        )
        .join(",")
    );
  });

  process.exit(0);
})();
