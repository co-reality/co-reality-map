#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import { VenueEvent } from "../src/types/venues";
import { WithId } from "../src/utils/id";

import {
  initFirebaseAdminApp,
  makeSaveToBackupFile,
  makeScriptUsage,
} from "./lib/helpers";

// ---------------------------------------------------------
// Configuration (this is the bit you should edit)
// ---------------------------------------------------------

const SOURCE_PROJECT_ID = "co-reality-map";
const DEST_PROJECT_ID = "co-reality-staging";

const SOURCE_CREDENTIAL_FILE =
  "co-reality-map-firebase-adminsdk-47j7x-530045073b.json";
const DEST_CREDENTIAL_FILE =
  "co-reality-staging-firebase-adminsdk-yy5cq-5fd568c2f4.json";

const VENUES_TO_CLONE = ["wayspace"];

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const CONFIRM_VALUE = "i-have-edited-the-script-and-am-sure-i-want-the-events";

const usage = makeScriptUsage({
  description:
    "Clone the event data for venue(s) between different firebase projects.",
  usageParams: CONFIRM_VALUE,
  exampleParams: CONFIRM_VALUE,
});

const [confirmationCheck] = process.argv.slice(2);
if (confirmationCheck !== CONFIRM_VALUE) {
  usage();
}

const sourceApp = initFirebaseAdminApp(SOURCE_PROJECT_ID, {
  appName: "sourceApp",
  credentialPath: resolve(__dirname, SOURCE_CREDENTIAL_FILE),
});

const destApp = initFirebaseAdminApp(DEST_PROJECT_ID, {
  appName: "destApp",
  credentialPath: resolve(__dirname, DEST_CREDENTIAL_FILE),
});

const saveToDestBackupFile = makeSaveToBackupFile(DEST_PROJECT_ID);

(async () => {
  // TODO: @debt use filters so we are only getting batches of the venues we want, use 'in', _.chunk + Promise.all, etc to page through the data
  const allSourceVenues = await sourceApp
    .firestore()
    .collection("venues")
    .listDocuments();

  const wantedSourceVenues = allSourceVenues.filter((venue) =>
    VENUES_TO_CLONE.includes(venue.id)
  );

  for (const sourceVenue of wantedSourceVenues) {
    const destVenueRef = destApp
      .firestore()
      .collection("venues")
      .doc(sourceVenue.id);

    const destVenue = await destVenueRef.get();

    // Check if the destination venue exists, and if not, skip copying events for it
    if (!destVenue.exists) {
      console.warn(
        "Destination venue document doesn't exist, skipping event copy:",
        sourceVenue.id
      );
      continue;
    }

    // Backup the existing destination event data just in case
    const destVenueEvents = await Promise.all(
      (await destVenueRef.collection("events").listDocuments()).map(
        async (eventRef) =>
          ({
            ...(await eventRef.get()).data(),
            id: eventRef.id,
          } as WithId<VenueEvent>)
      )
    );
    saveToDestBackupFile(destVenueEvents, `${destVenueRef.id}-events`);

    // Copy the source venue events to the destination venue in a batch

    const sourceVenueEvents = await sourceVenue
      .collection("events")
      .listDocuments();

    console.log(
      `Copying ${sourceVenueEvents.length} events for ${sourceVenue.id}..`
    );

    const destAppBatch = destApp.firestore().batch();

    for (const sourceVenueEvent of sourceVenueEvents) {
      const destEventRef = destApp
        .firestore()
        .collection("venues")
        .doc(sourceVenue.id)
        .collection("events")
        .doc(sourceVenueEvent.id);

      const destVenueEvent = await sourceVenueEvent
        .get()
        .then((snapshot) =>
          snapshot.exists ? (snapshot.data() as VenueEvent) : undefined
        );

      if (!destVenueEvent) {
        console.warn(
          `  Event data missing for ${sourceVenueEvent.path}, skipping copy..`
        );
        continue;
      }

      console.warn(
        `  Adding ${sourceVenueEvent.path} data to batch copy: ${destVenueEvent.name}`
      );
      destAppBatch.set(destEventRef, destVenueEvent);
    }

    console.log(`Executing batch copy for ${sourceVenue.id}..`);
    const writeResult = await destAppBatch.commit();
    console.log(writeResult);
    console.log(`Finished batch copy for ${sourceVenue.id}!`);
  }
})();
