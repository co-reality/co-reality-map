#!/usr/bin/env node -r esm -r ts-node/register

import { resolve } from "path";

import { AnyVenue } from "../src/types/venues";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

// ---------------------------------------------------------
// Configuration (this is the bit you should edit)
// ---------------------------------------------------------

const SOURCE_PROJECT_ID = "co-reality-map";
const DEST_PROJECT_ID = "co-reality-staging";

const SOURCE_CREDENTIAL_FILE =
  "co-reality-map-firebase-adminsdk-47j7x-530045073b.json";
const DEST_CREDENTIAL_FILE =
  "co-reality-staging-firebase-adminsdk-yy5cq-5fd568c2f4.json";

const SOURCE_DOMAIN = "sparkle.space";
const DEST_DOMAIN = "staging.sparkle.space";

const VENUES_TO_CLONE = ["wayspace"];

const VENUE_RENAME_MAP: Partial<Record<string, string>> = {
  foo: "bar",
};

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const CONFIRM_VALUE = "i-have-edited-the-script-and-am-sure";
const DRY_RUN = "--dry-run";

const usage = makeScriptUsage({
  description: "Clone venue(s) between different firebase projects.",
  usageParams: `${CONFIRM_VALUE} [${DRY_RUN}]`,
  exampleParams: `${CONFIRM_VALUE} [${DRY_RUN}]`,
});

const [confirmationCheck, dryRun] = process.argv.slice(2);
if (confirmationCheck !== CONFIRM_VALUE) {
  usage();
}

const isDryRun = dryRun === DRY_RUN;

const sourceApp = initFirebaseAdminApp(SOURCE_PROJECT_ID, {
  appName: "sourceApp",
  credentialPath: resolve(__dirname, SOURCE_CREDENTIAL_FILE),
});

const destApp = initFirebaseAdminApp(DEST_PROJECT_ID, {
  appName: "destApp",
  credentialPath: resolve(__dirname, DEST_CREDENTIAL_FILE),
});

// TODO: do we need to copy roles across?
// TODO: venues (owners will need to be changed)
// TODO: check if venue already exists (be safe, don't overwrite!)
// TODO: use VENUE_RENAME_MAP when rewriting room/etc urls (in case we renamed the venue)

const replaceSourceDomainReferences = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>,
  key: string,
  objectType: string,
  objectIdentifier: string
) => {
  const objVal = obj[key];

  if (typeof objVal !== "string") return;

  if (objVal.toString().includes(`//${SOURCE_DOMAIN}`)) {
    const replacementValue = objVal.replace(
      `//${SOURCE_DOMAIN}`,
      `//${DEST_DOMAIN}`
    );

    console.log(
      "  Rewriting reference to",
      SOURCE_DOMAIN,
      "in",
      `'${objectType}'`,
      `'${objectIdentifier}'`,
      "with key",
      `'${key}'`
    );
    console.log("    Before :", obj[key]);
    console.log("    After  :", replacementValue);

    obj[key] = replacementValue;
  }
};

(async () => {
  // TODO: @debt use filters so we are only getting batches of the venues we want, use 'in', _.chunk + Promise.all, etc to page through the data
  const allSourceVenues = await sourceApp
    .firestore()
    .collection("venues")
    .listDocuments();

  const wantedSourceVenues = await Promise.all(
    allSourceVenues
      .filter((venue) => VENUES_TO_CLONE.includes(venue.id))
      .map((venue) =>
        venue.get().then((v) => ({ ...(v.data() as AnyVenue), id: v.id }))
      )
  );

  console.log("total venues:", allSourceVenues.length);
  console.log("wanted venues:", wantedSourceVenues.length, VENUES_TO_CLONE);
  console.log("venue renames:", VENUE_RENAME_MAP);
  console.log();

  console.log(
    "Will copy",
    wantedSourceVenues.length,
    "venues from",
    sourceApp.options.projectId,
    "to",
    destApp.options.projectId
  );
  console.log(
    "  source venues      :",
    wantedSourceVenues.map((venue) => venue.id)
  );
  console.log(
    "  destination venues :",
    wantedSourceVenues.map((venue) => VENUE_RENAME_MAP[venue.id] ?? venue.id)
  );
  console.log();

  // TODO: we should save backups before we potentially overwrite things..
  // const saveToBackupFile = makeSaveToBackupFile(
  //   `${projectId}-foo`
  // );

  const destAppBatch = destApp.firestore().batch();

  wantedSourceVenues.forEach((venue) => {
    const { id, ...venueData } = venue;

    // Rename the destinationVenueId if required
    const destinationVenueId = VENUE_RENAME_MAP[id] ?? id;

    const destVenueRef = destApp
      .firestore()
      .collection("venues")
      .doc(destinationVenueId);

    // @debt will there ever even be any URLs that need rewriting in these 'root venue keys'?
    Object.keys(venue).forEach((key) => {
      replaceSourceDomainReferences(venue, key, "venue", venue.id);
    });

    if (venue.rooms) {
      venue.rooms.forEach((room) => {
        Object.keys(room).forEach((key) => {
          replaceSourceDomainReferences(room, key, "room", room.title);
        });
      });
    }

    destAppBatch.set(destVenueRef, venueData);

    console.log("added venue to batch:", destinationVenueId, `(${venue.name})`);
  });

  if (!isDryRun) {
    const writeResult = await destAppBatch.commit();
    console.log(writeResult);
  } else {
    console.log(
      "[DRY-RUN] Not committing transaction. Nothing has been changed."
    );
  }
})()
  .then(() => {
    console.log("Finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.log("Failed: ", error);
    process.exit(1);
  });
