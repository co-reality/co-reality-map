#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import {
  checkFileExists,
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

// ---------------------------------------------------------
// HERE THERE BE DRAGONS (edit below here at your own risk)
// ---------------------------------------------------------

const usage = makeScriptUsage({
  description: `Bulk add auditorium sections ( rooms )`,
  usageParams: `CREDENTIAL_PATH VENUE_NAME NUMBER_OF_SECTIONS`,
  exampleParams: `fooAccountKey.json bootstrap 5`,
});

const [credentialPath, venueName, sectionValue] = process.argv.slice(2);

const numberOfSections = parseInt(sectionValue, 10);

if (!credentialPath || !venueName || !numberOfSections) {
  usage();
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

const appBatch = app.firestore().batch();

(async () => {
  for (let section = 1; section <= numberOfSections; section++) {
    const destVenueEventsRef = app
      .firestore()
      .collection(`venues/${venueName}/sections`)
      .doc();

    appBatch.set(destVenueEventsRef, { isVip: false });
  }

  await appBatch.commit();

  console.log(
    `Succesfully created ${numberOfSections} sections in the ${venueName} venue.`
  );
})();
