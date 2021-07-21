#!/usr/bin/env node -r esm -r ts-node/register

import fs from "fs";
import { resolve } from "path";

import "firebase/firestore";
import { intersection, uniq } from "lodash";

import { VenueAccessMode } from "../src/types/VenueAcccess";

import {
  initFirebaseAdminApp,
  makeScriptUsage,
  FieldValue,
} from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Configures the venue access with the selected method and value",
  usageParams: [
    "PROJECT_ID VENUE_IDS METHOD ACCESS_DETAIL [CREDENTIAL_PATH]",
    "",
    `PROJECT_ID VENUE_IDS ${VenueAccessMode.Password} THE_PASSWORD_TO_SET [CREDENTIAL_PATH]`,
    `PROJECT_ID VENUE_IDS ${VenueAccessMode.Emails} LIST_OF_EMAILS_PATH [CREDENTIAL_PATH]`,
    `PROJECT_ID VENUE_IDS ${VenueAccessMode.Codes} LIST_OF_ONE_TIME_USE_CODES_PATH [CREDENTIAL_PATH]`,
  ],
  exampleParams: [
    `co-reality-map venueId                    ${VenueAccessMode.Password} secretPassword123 [theMatchingAccountServiceKey.json]`,
    `co-reality-map venueId1,venueId2,venueIdN ${VenueAccessMode.Password} secretPassword123 [theMatchingAccountServiceKey.json]`,
    "",
    `co-reality-map venueId                    ${VenueAccessMode.Emails} emails-one-per-line.txt [theMatchingAccountServiceKey.json]`,
    `co-reality-map venueId1,venueId2,venueIdN ${VenueAccessMode.Emails} emails-one-per-line.txt [theMatchingAccountServiceKey.json]`,
    "",
    `co-reality-map venueId                    ${VenueAccessMode.Codes} one-time-use-ticket-codes-one-per-line.txt [theMatchingAccountServiceKey.json]`,
    `co-reality-map venueId1,venueId2,venueIdN ${VenueAccessMode.Codes} one-time-use-ticket-codes-one-per-line.txt [theMatchingAccountServiceKey.json]`,
  ],
});

// TODO: refactor this to work with multiple venueIds at once, in a similar way to how scripts/count-users-entered-venue.ts works

const [
  projectId,
  venueIds,
  method,
  accessDetail,
  credentialPath,
] = process.argv.slice(2);
if (!projectId || !venueIds || !method || !accessDetail) {
  usage();
}
console.log();

if (!VenueAccessMode[method as keyof typeof VenueAccessMode]) {
  console.error(`Invalid access method ${method}`);
  process.exit(1);
}

const venueIdsArray = venueIds.split(",");

if (venueIdsArray.length === 0) {
  console.error("Error: You must specify at least 1 venueId to process.");
  console.error("  venueIdsArray.length :", venueIdsArray.length);
  process.exit(1);
}

const uniqueVenueIdsArray = uniq(venueIdsArray);
if (venueIdsArray.length !== uniqueVenueIdsArray.length) {
  console.error("Error: You cannot specify duplicate venueIds to process.");
  console.error("  venueIdsArray.length       :", venueIdsArray.length);
  console.error("  uniqueVenueIdsArray.length :", uniqueVenueIdsArray.length);
  console.error(
    "  duplicate venueIds         :",
    intersection(venueIdsArray, uniqueVenueIdsArray)
  );
  process.exit(1);
}

// Firestore's batch write limit is 500 entries. Since we make 2 writes per venue, we can process up to 250 venues at once.
//   Note: it's super unlikely we will ever need to handle this, but if we do, we can split our firestore query into 'chunks'
const MAX_VENUE_IDS = 250;
if (venueIdsArray.length > MAX_VENUE_IDS) {
  console.error(
    `Error: This script can only process up to ${MAX_VENUE_IDS} venueIds at once at the moment.`
  );
  console.error("  venueIdsArray.length :", venueIdsArray.length);
  process.exit(1);
}

const app = initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const allVenueDocRefs = venueIdsArray.map((venueId) =>
  app.firestore().collection("venues").doc(venueId)
);

const allVenueAccessDocRefs = allVenueDocRefs.map((venueDocRef) =>
  venueDocRef.collection("access").doc(method)
);

(async () => {
  // Check that all the requested venues exist
  const allVenueDocs = await Promise.all(
    allVenueDocRefs.map((venueDocRef) => venueDocRef.get())
  );

  const missingVenueIds = allVenueDocs
    .filter((venueDoc) => !venueDoc.exists)
    .map((venueDoc) => venueDoc.id);

  if (missingVenueIds.length > 0) {
    missingVenueIds.forEach((venueId) => {
      console.error(`Error: venue '${venueId}' doesn't exist`);
    });

    throw new Error(
      `${missingVenueIds.length} out of the ${allVenueDocRefs.length} requested venues don't exist`
    );
  }

  // Batch all of our writes together in a single atomic commit
  const batchWrite = app.firestore().batch();

  // Configure the venue's access mode
  console.log(
    `[batch] Preparing to configure ${allVenueDocRefs.length} venue's access modes to use '${method}'..`
  );
  allVenueDocRefs.forEach((venueDocRef) => {
    console.log(`[batch]   ${venueDocRef.id}`);
    batchWrite.update(venueDocRef, { access: method });
  });
  console.log();

  // Configure the venue's access data
  console.log(
    `[batch] Preparing to configure ${allVenueAccessDocRefs.length} venue's access data for '${method}' using '${accessDetail}'..`
  );
  switch (method) {
    case VenueAccessMode.Password: {
      const password = accessDetail.trim();

      console.log(
        `[batch]   Preparing to configure password for ${allVenueAccessDocRefs.length} venue(s)..`
      );
      allVenueAccessDocRefs.forEach((venueAccessDocRef) => {
        const venueId = venueAccessDocRef.parent.parent?.id;
        console.log(`[batch]     Prepared ${venueId}`);
        batchWrite.set(venueAccessDocRef, { password });
      });
      break;
    }

    case VenueAccessMode.Emails: {
      console.log(
        `[batch]   Reading email addresses from file: ${accessDetail}`
      );
      const emails: string[] = fs
        .readFileSync(accessDetail, "utf-8")
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter((line) => {
          const isEmail = line.includes("@");

          // We don't want to spam the logs about empty lines
          if (!isEmail && line.length > 0) {
            console.warn(
              `[batch]     Warning: Line doesn't appear to be an email, skipping: ${line}`
            );
          }

          return isEmail;
        });
      console.log();

      console.log(
        `[batch]   Preparing to append ${emails.length} email address(es) to whitelist for ${allVenueAccessDocRefs.length} venue(s)..`
      );
      allVenueAccessDocRefs.forEach((venueAccessDocRef) => {
        const venueId = venueAccessDocRef.parent.parent?.id;
        console.log(`[batch]     Prepared ${venueId}`);
        batchWrite.set(
          venueAccessDocRef,
          {
            emails: FieldValue.arrayUnion(...emails),
          },
          { merge: true }
        );
      });
      break;
    }

    case VenueAccessMode.Codes: {
      console.log(`[batch]   Reading access codes from file: ${accessDetail}`);
      const codes: string[] = fs
        .readFileSync(accessDetail, "utf-8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      console.log();

      console.log(
        `[batch]   Preparing to append ${codes.length} access codes to list for ${allVenueAccessDocRefs.length} venue(s)..`
      );
      allVenueAccessDocRefs.forEach((venueAccessDocRef) => {
        const venueId = venueAccessDocRef.parent.parent?.id;
        console.log(`[batch]     Prepared ${venueId}`);
        batchWrite.set(
          venueAccessDocRef,
          {
            codes: FieldValue.arrayUnion(...codes),
          },
          { merge: true }
        );
      });
      break;
    }
  }
  console.log();

  // Commit our batch of prepared writes
  console.log("[batch] Committing all prepared writes to the database..");
  await batchWrite.commit();
  console.log();
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Done");
    process.exit(0);
  });
