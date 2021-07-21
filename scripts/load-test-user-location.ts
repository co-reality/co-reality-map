#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";

import admin from "firebase-admin";
import { differenceInMilliseconds, formatDistanceStrict } from "date-fns";

import { withId } from "../src/utils/id";
import { User } from "../src/types/User";
import { AnyVenue } from "../src/types/venues";

import {
  FieldValue,
  initFirebaseAdminApp,
  makeScriptUsage,
} from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Simulate user location updates to load test the platform",
  usageParams:
    "PROJECT_ID USER_ID VENUE_ID UPDATE_INTERVAL_MS [CREDENTIAL_PATH]",
  exampleParams:
    "co-reality-map abc123 myvenue 2000 [theMatchingAccountServiceKey.json]",
});

const [
  projectId,
  userId,
  venueId,
  _updateIntervalMs,
  credentialPath,
] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !userId || !venueId || !_updateIntervalMs) {
  usage();
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const updateIntervalMs = parseInt(_updateIntervalMs);

const UPDATE_INTERVAL_MS_LIMIT = 1000;

if (updateIntervalMs < UPDATE_INTERVAL_MS_LIMIT) {
  console.error(
    `Error: We can only update an individual user's document once per second. Please choose a number >= ${UPDATE_INTERVAL_MS_LIMIT}`
  );
  console.error("");
  console.error(
    "If you need to support more than this, the script will need to be refactored to update multiple users."
  );
  process.exit(1);
}

const userRef = admin.firestore().collection("users").doc(userId);
const venueRef = admin.firestore().collection("venues").doc(venueId);

(async () => {
  console.log(
    "Checking that both user and venue exist and are configured correctly for this test:"
  );
  console.log(`  userId           = ${userId}`);
  console.log(`  venueId          = ${venueId}`);

  const [userDoc, venueDoc] = await Promise.all([
    userRef.get(),
    venueRef.get(),
  ]);

  const userData = userDoc.data() as User | undefined;
  const user = userData ? withId(userData, userDoc.id) : undefined;

  const venueData = venueDoc.data() as AnyVenue | undefined;
  const venue = venueData ? withId(venueData, venueDoc.id) : undefined;

  if (!user && !venue) throw new Error(`user/venue not found`);
  if (!user) throw new Error("user not found");
  if (!venue) throw new Error("venue not found");
  if (!venue.name) throw new Error("unable to extract venue's name");

  if (!user.enteredVenueIds?.includes(venue.id)) {
    console.log(
      "\nVenue is missing from user's enteredVenueIds. Adding it now.."
    );

    await userRef.update({
      enteredVenueIds: FieldValue.arrayUnion(venue.id),
    });

    console.log("  Done!");
  }

  console.log("\nBoth user and venue look good now. Starting load test..");
  console.log(`  updateIntervalMs = ${updateIntervalMs} (milliseconds)`);

  const startTime = Date.now();
  let updateCount = 0;

  const updateUserLocation = () => {
    const now = Date.now();

    const newLocationData = {
      lastSeenAt: now,
      lastSeenIn: {
        [venue.name]: now,
      },
    };

    userRef.update(newLocationData).then((result) => {
      const updatedAt = result.writeTime.toDate().toJSON();

      console.log(
        `[${updatedAt}] Updated location for user=${userRef.id} in venueName=${venue.name} and time=${now}`
      );

      updateCount++;
    });
  };

  // Run the first update straight away
  updateUserLocation();

  // Then keep running the updates every interval after that
  const intervalId = setInterval(updateUserLocation, updateIntervalMs);

  // Wait until user tries to exit with CTRL-C
  await new Promise((resolve) => {
    console.log("\nPress CTRL-C to exit..\n");

    process.on("SIGINT", () => {
      clearInterval(intervalId);

      console.log("\nCTRL-C detected, stopping load test..\n");

      // This is just used to complete the promise, the value is irrelevant
      resolve(undefined);
    });
  });

  const endTime = Date.now();
  const totalTime = formatDistanceStrict(endTime, startTime);
  const averageUpdateInterval =
    differenceInMilliseconds(endTime, startTime) / updateCount;

  console.log(
    `Load test ran for ${totalTime} and completed ${updateCount} location updates in this time, with an average update interval of ${averageUpdateInterval} (milliseconds)`
  );
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
