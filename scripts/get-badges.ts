#!/usr/bin/env node -r esm -r ts-node/register

import { resolve } from "path";

import admin from "firebase-admin";
import { chunk } from "lodash";
import fs from "fs";
import { UserVisit } from "../src/types/Firestore";
import { User } from "../src/types/User";

import { WithId, withId } from "../src/utils/id";
import { formatSecondsAsHHMMSS } from "../src/utils/time";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description:
    "Retrieve 'badge' details (in CSV format) of users who entered the specified venue(s), and how long they spent in each.",
  usageParams: "PROJECT_ID VENUE_IDS [CREDENTIAL_PATH]",
  exampleParams:
    "co-reality-map venueId,venueId2,venueIdN [theMatchingAccountServiceKey.json]",
});

const [projectId, venueIds, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId || !venueIds) {
  usage();
}

const venueIdsArray = venueIds.split(",");

// Note: if we ever need to handle this, we can split our firestore query into 'chunks', each with 10 items per array-contains-any
if (venueIdsArray.length > 10) {
  console.error(
    "Error: This script can only handle up to 10 venueIds at once at the moment."
  );
  console.error("  venueIdsArray.length :", venueIdsArray.length);
  process.exit(1);
}

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

interface UsersWithVisitsResult {
  user: WithId<User>;
  visits: WithId<UserVisit>[];
}

(async () => {
  // TODO: extract this as a generic helper function?
  const usersWithVisits: UsersWithVisitsResult[] = await Promise.all(
    await admin
      .firestore()
      .collection("users")
      .where("enteredVenueIds", "array-contains-any", venueIdsArray)
      .get()
      .then((usersSnapshot) =>
        usersSnapshot.docs.map(async (userDoc) => {
          const user = withId(userDoc.data() as User, userDoc.id);

          const visits = await userDoc.ref
            .collection("visits")
            .get()
            .then((visitsSnapshot) =>
              visitsSnapshot.docs.map((visitDoc) =>
                withId(visitDoc.data() as UserVisit, visitDoc.id)
              )
            );

          return { user, visits };
        })
      )
  );

  // TODO: extract this as a generic helper function?
  // Note: 100 is the max that can be requested with getUsers() per chunk
  const authUsers: admin.auth.UserRecord[] = await Promise.all(
    chunk(usersWithVisits, 100).map(async (usersWithVisitsChunk) => {
      const chunkUserIds = usersWithVisitsChunk.map((userWithVisits) => ({
        uid: userWithVisits.user.id,
      }));

      const authUsersResult = await admin.auth().getUsers(chunkUserIds);

      return authUsersResult.users;
    })
  ).then((result) => result.flat());

  const authUsersById: Record<
    string,
    admin.auth.UserRecord | undefined
  > = authUsers.reduce(
    (acc, authUser) => ({ ...acc, [authUser.uid]: authUser }),
    {}
  );

  // TODO: filter enteredVenueIds and visitsTimeSpent so that they only contain related venues?
  const result = usersWithVisits
    .map((userWithVisits) => {
      const { user, visits } = userWithVisits;
      const { id, partyName } = user;
      const { email } = authUsersById[id] ?? {};

      const visitsTimeSpent = visits.map(
        (visit) => `${visit.id} (${formatSecondsAsHHMMSS(visit.timeSpent)})`
      );

      const visitIds = visits.map((el) => el.id);

      // write all visit IDs for badge counts
      visitIds.map((visit) =>
        fs.writeFileSync("./allVisits.csv", `${visit} \n`, { flag: "a" })
      );

      return {
        id,
        email,
        partyName,
        visitsTimeSpent: visitsTimeSpent.sort().join(", "),
        visits,
      };
    })
    .filter((user) => !!user.visits.length);

  const allResultVisits: string[] = result.reduce((arr: string[], el) => {
    const result: string[] = el.visits.map((e) => e.id);
    result.map((e) => arr.push(e));

    return arr;
  }, []);

  const uniqueVisits = [...new Set(allResultVisits)];

  // write all unique venues
  uniqueVisits.map((el) =>
    fs.writeFileSync("./uniqueVenues.csv", `${el} \n`, { flag: "a" })
  );

  // Display CSV headings
  console.log(
    ["Email", "Party Name", "Rooms Entered", "Entered Venues (Time Spent)"]
      .map((heading) => `"${heading}"`)
      .join(",")
  );

  // Write all user data for analytics
  result.forEach((user) => {
    const csvLine = [
      user.email,
      user.partyName,
      user.visits.length,
      user.visitsTimeSpent,
    ]
      .map((s) => `"${s}"`)
      .join(",");

    fs.writeFileSync("./allData.csv", `${csvLine} \n`, { flag: "a" });
  });
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
