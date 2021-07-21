#!/usr/bin/env node -r esm -r ts-node/register

import {
  checkFileExists,
  FieldValue,
  findUserByEmail,
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

// ---------------------------------------------------------
// Configuration (this is the bit you should edit)
// ---------------------------------------------------------

const VENUES_TO_CHANGE_OWNERSHIP: string[] = [];

const EMAIL_ADDRESSES: string[] = [];

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

enum Mode {
  Add = "ADD",
  Remove = "REMOVE",
}

const VALID_MODES: string[] = [Mode.Add, Mode.Remove];

const usage = makeScriptUsage({
  description: `Bulk add users to the owners list based on the supplied email address(es).\n\n(Note: the accounts must already exist.)`,
  usageParams: `CREDENTIAL_PATH VENUE1 VENUE2 VENUEN [${Mode.Add}/${Mode.Remove}] EMAIL1 EMAIL2 EMAILN...`,
  exampleParams: `fooAccountKey.json home park ADD foouser@example.com baruser@example.com`,
});

const [credentialPath, ...extraArgs] = process.argv.slice(2);
const modeIndex = extraArgs.findIndex((arg) => VALID_MODES.includes(arg));

if (!credentialPath || modeIndex === -1) {
  usage();
}

const mode = extraArgs[modeIndex];
const extraVenues = extraArgs.slice(0, modeIndex);
const extraEmailAddresses = extraArgs.slice(modeIndex + 1);

const allVenuesToUpdate = [...VENUES_TO_CHANGE_OWNERSHIP, ...extraVenues];
const allEmailAddresses = [...EMAIL_ADDRESSES, ...extraEmailAddresses];

if (allVenuesToUpdate.length === 0) {
  console.error("Error: No venues provided");
  process.exit(1);
}

if (allEmailAddresses.length === 0) {
  console.error("Error: No email addresses provided");
  process.exit(1);
}

if (!checkFileExists(credentialPath)) {
  console.error("Credential file path does not exists:", credentialPath);
  process.exit(1);
}

const { project_id: projectId } = parseCredentialFile(credentialPath);

if (!projectId) {
  console.error("Credential file has no project_id:", credentialPath);
  process.exit(1);
}

const app = initFirebaseAdminApp(projectId, { credentialPath });

(async () => {
  for (const venue of allVenuesToUpdate) {
    console.log(
      `\n===== Updating the ownership of the following venue: ${venue}`
    );
    const venueDocRef = app.firestore().collection("venues").doc(venue);

    for (const email of allEmailAddresses) {
      const existingUser = await findUserByEmail(app)(email);

      if (!existingUser) {
        console.warn(`No user found for ${email}, skipping..`);
        continue;
      }

      switch (mode) {
        // Add user's UID to the owners list
        case Mode.Add:
          await venueDocRef
            .update({ owners: FieldValue.arrayUnion(existingUser.uid) })
            .then(() => {
              console.log(
                `User successfully added to (or already existed in) the owners list: email=${email}, uid=${existingUser.uid}`
              );
            })
            .catch((err) =>
              console.error(
                `Failed when trying to add ${email} (uid=${existingUser.uid}) to the owners list...`,
                err
              )
            );
          break;

        case Mode.Remove:
          // Remove user's UID from the owners list
          await venueDocRef
            .update({ owners: FieldValue.arrayRemove(existingUser.uid) })
            .then(() => {
              console.log(
                `User successfully removed from (or didn't exist in) from the owners list : email=${email}, uid=${existingUser.uid}`
              );
            })
            .catch((err) =>
              console.error(
                `Failed when trying to remove ${email} (uid=${existingUser.uid}) from the owners list, skipping..`,
                err
              )
            );
          break;

        default:
          throw new Error(`Unknown mode: ${mode}`);
      }
    }
  }
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
