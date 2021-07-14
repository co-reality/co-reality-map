#!/usr/bin/env node -r esm -r ts-node/register

import {
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

import { eventsFromCSVFile } from "../src/utils/event";
import { VenueEvent } from "../src/types/venues";
import { resolve } from "path";

const usage = makeScriptUsage({
  description: "Bulk upload events from a spreadsheet ",
  usageParams: "PROJECT_ID FILE CREDENTIAL_PATH",
  exampleParams: "co-reality-staging add-event-by-csv.example.csv key.json",
});

const [projectId, filePath, credentialPath] = process.argv.slice(2);

if (!credentialPath || !filePath) {
  usage();
}

const { project_id: projectIdCredentialFile } = parseCredentialFile(
  credentialPath
);

if (projectId !== projectIdCredentialFile) {
  console.error(
    "Project_Id is not the same with project_Id in credential file"
  );
  process.exit(1);
}

const app = initFirebaseAdminApp(projectIdCredentialFile, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

type eventWithVenueId = {
  event: VenueEvent;
  venueId: string;
};

(async () => {
  const events = await eventsFromCSVFile(filePath);
  if (events) {
    const venuesRef = app.firestore().collection("venues");
    const allVenueIds = (await venuesRef.get()).docs.map((venue) => venue.id);

    const appBatch = app.firestore().batch();

    events.forEach((event: eventWithVenueId) => {
      const eventRef = app
        .firestore()
        .collection("venues")
        .doc(event.venueId)
        .collection("events")
        .doc();

      if (!allVenueIds.includes(event.venueId)) {
        console.log("no venue id", event);

        return;
      }

      appBatch.set(eventRef, event.event);
    });

    await appBatch.commit();
    console.log("Run successfully");
  }
})();
