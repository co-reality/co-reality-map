#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

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

const EMAIL_ADDRESSES: string[] = [];

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const ROLE: string = "admin";

enum Mode {
  Add = "ADD",
  Remove = "REMOVE",
}

const VALID_MODES: string[] = [Mode.Add, Mode.Remove];

const usage = makeScriptUsage({
  description: `Bulk add users to the ${ROLE} role based on the supplied email address(es).\n\n(Note: the accounts must already exist.)`,
  usageParams: `CREDENTIAL_PATH [${Mode.Add}/${Mode.Remove}] EMAIL1 EMAIL2 EMAIlN...`,
  exampleParams: `fooAccountKey.json ADD foouser@example.com baruser@example.com`,
});

const [credentialPath, mode, ...extraEmailAddresses] = process.argv.slice(2);
if (!credentialPath || !VALID_MODES.includes(mode)) {
  usage();
}

const allEmailAddresses = [...EMAIL_ADDRESSES, ...extraEmailAddresses];

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

const roleDocRef = app.firestore().collection("roles").doc(ROLE);

(async () => {
  for (const email of allEmailAddresses) {
    const existingUser = await findUserByEmail(app)(email);

    if (!existingUser) {
      console.warn(`No user found for ${email}, skipping..`);
      continue;
    }

    switch (mode) {
      // Add user's UID to the role
      case Mode.Add:
        await roleDocRef
          .update({ users: FieldValue.arrayUnion(existingUser.uid) })
          .then((result) => {
            console.log(
              `User successfully added to (or already existed in) '${ROLE}' role: email=${email}, uid=${existingUser.uid}`
            );
          })
          .catch((err) =>
            console.error(
              `Failed when trying to add ${email} (uid=${existingUser.uid}) to '${ROLE}' role, skipping..`,
              err
            )
          );
        break;

      case Mode.Remove:
        // Remove user's UID from the role
        await roleDocRef
          .update({ users: FieldValue.arrayRemove(existingUser.uid) })
          .then((result) => {
            console.log(
              `User successfully removed from (or didn't exist in) '${ROLE}' role: email=${email}, uid=${existingUser.uid}`
            );
          })
          .catch((err) =>
            console.error(
              `Failed when trying to remove ${email} (uid=${existingUser.uid}) from '${ROLE}' role, skipping..`,
              err
            )
          );
        break;

      default:
        throw new Error(`Unknown mode: ${mode}`);
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
