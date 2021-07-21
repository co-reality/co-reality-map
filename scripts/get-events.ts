#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description:
    "Get event details. Prints each event start and end time among other details.",
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
  console.log(
    [
      "Venue ID",
      "Venue Name",
      "Event Name",
      "Event Host",
      "Event Description",
      "Room",
      "Start Time",
      "Duration (Days)",
      "End Time",
    ]
      .map((heading) => `"${heading}"`)
      .join(",")
  );

  // @debt This function will currently load all venues in firebase into memory.. not very efficient
  const firestoreVenues = await admin.firestore().collection("venues").get();

  firestoreVenues.docs.forEach((doc) => {
    (async () => {
      const venueId = doc.id;
      const venueName = doc.data().name;
      const events = await admin
        .firestore()
        .collection("venues")
        .doc(venueId)
        .collection("events")
        .get();

      events.forEach((eventDoc) => {
        const eventName = eventDoc.data().name;
        const eventHost = eventDoc.data().host;
        const eventDescription = eventDoc.data().description;
        const eventRoom = eventDoc.data().room;
        const startTime = new Date(
          eventDoc.data().start_utc_seconds * 1000
        ).getTime();
        const durationMinutes = eventDoc.data().duration_minutes;
        const durationDays = durationMinutes / (60 * 24);
        const endTime = startTime + durationMinutes * 60 * 1000;

        console.log(
          [
            venueId,
            venueName,
            eventName,
            eventHost,
            eventDescription,
            eventRoom,
            new Date(startTime).toISOString(),
            durationDays,
            new Date(endTime).toISOString(),
          ]
            .map(
              (v) =>
                `"${(v ?? "")
                  .toString()
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
    })();
  });
})();
