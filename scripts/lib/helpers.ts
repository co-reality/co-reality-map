import { existsSync, readFileSync, writeFileSync } from "fs";
import { relative, resolve } from "path";

import admin from "firebase-admin";
import formatDate from "date-fns/format/index.js";

import { asArray } from "../../src/utils/types";

export interface CredentialFile {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

/**
 * Re-export static helpers from Firestore to simplify usage.
 */
export const { FieldValue } = admin.firestore;

/**
 * Initialise a new Firebase Admin App
 *
 * @param projectId Firebase project ID
 * @param appName An arbitrary name to reference this app by within the script (mostly
 *   useful when connecting to 2 projects in the same script, eg. to copy data between them)
 * @param credentialPath Path to the Firebase credential file to be used
 *
 * @example Basic Usage
 *   initFirebaseAdminApp(projectId);
 *
 * @example Resolving/using a specific credential file (if defined)
 *   initFirebaseAdminApp(projectId, {
 *     credentialPath: credentialPath
 *       ? resolve(__dirname, credentialPath)
 *       : undefined,
 *   });
 *
 * @example Initialising two projects at once (eg. to copy data between them)
 *   const sourceApp = initFirebaseAdminApp(SOURCE_PROJECT_ID, {
 *     appName: "sourceApp",
 *     credentialPath: resolve(__dirname, SOURCE_CREDENTIAL_FILE),
 *   });
 *
 *   const destApp = initFirebaseAdminApp(DEST_PROJECT_ID, {
 *     appName: "destApp",
 *     credentialPath: resolve(__dirname, DEST_CREDENTIAL_FILE),
 *   });
 */
export const initFirebaseAdminApp = (
  projectId: string,
  {
    appName,
    credentialPath: _credentialPath,
  }: { appName?: string; credentialPath?: string } = {}
): admin.app.App => {
  const credentialPath = _credentialPath ?? resolveDefaultCredentialPath();

  ensureProjectIdMatchesCredentialProjectId(projectId, credentialPath);

  return admin.initializeApp(
    {
      projectId,
      credential: admin.credential.cert(credentialPath),
      storageBucket: `${projectId}.appspot.com`,
    },
    appName
  );
};

/**
 * Resolve the absolute path to <repo>/scripts/prodAccountKey.json
 */
export const resolveDefaultCredentialPath = () =>
  resolve(__dirname, "../prodAccountKey.json");

/**
 * Check if the supplied file path exists.
 *
 * @param path
 */
export const checkFileExists = (path: string) => existsSync(path);

/**
 * Read/parse the supplied Firebase credential file into an object.
 *
 * @param credentialPath path to the credential file to be parsed
 */
export const parseCredentialFile = (
  credentialPath: string = resolveDefaultCredentialPath()
): CredentialFile => JSON.parse(readFileSync(credentialPath, "utf8"));

/**
 * Ensure the supplied projectId matches the projectId in the credential file,
 * or exit with an error if not.
 *
 * @param projectId the firebase project ID to be checked
 * @param credentialPath the firebase credential file to check against
 */
export const ensureProjectIdMatchesCredentialProjectId = (
  projectId: string,
  credentialPath: string
) => {
  const credentialData = parseCredentialFile(credentialPath);

  if (projectId !== credentialData.project_id) {
    console.error(
      "Error: projectId doesn't match credentialData.project_id, did you choose the right file?"
    );
    console.error("  projectId                 :", projectId);
    console.error("  credentialData.project_id :", credentialData.project_id);
    process.exit(1);
  }
};

/**
 * Helper to remove the boilerplate of making the usage() function (aka: help text) that we use in our scripts.
 *
 * @param description the text used for the main overview description of the script
 * @param usageParams shows the positioning of each script parameter and what it's general name is
 * @param exampleParams shows an example of supplying values for each script parameter
 *
 * @example One line for usage/example
 *   const usage = makeScriptUsage({
 *     description:   "Describe my script in a really useful way.",
 *     usageParams:   "PROJECT_ID VENUE_IDS [CREDENTIAL_PATH]", // Note: CREDENTIAL_PATH is optional here
 *     exampleParams: "my-project-id venueId,venueId2,venueIdN [theMatchingAccountServiceKey.json]",
 *   });
 *
 * @example Multiple lines for usage/example
 *   const usage = makeScriptUsage({
 *     description: "Describe my script in a really useful way.",
 *     usageParams: [
 *       "PROJECT_ID VENUE_IDS [CREDENTIAL_PATH]"
 *       "PROJECT_ID VENUE_IDS SOMETHINGELSE [CREDENTIAL_PATH]"
 *     ], // Note: CREDENTIAL_PATH is optional here
 *     exampleParams: [
 *       "my-project-id venueId,venueId2,venueIdN [theMatchingAccountServiceKey.json]",
 *     ]
 *   });
 */
export const makeScriptUsage = ({
  description,
  usageParams,
  exampleParams,
}: {
  description: string;
  usageParams: string | string[];
  exampleParams: string | string[];
}) => () => {
  const scriptName = relative(process.cwd(), process.argv[1]);

  const usageLines = asArray(usageParams).map((params) =>
    params ? `${scriptName} ${params}` : ""
  );

  const exampleLines = asArray(exampleParams).map((params) =>
    params ? `${scriptName} ${params}` : ""
  );

  const renderLines = (lines: string[]) => {
    const prefix = lines.length > 1 ? "\n  " : "";

    return `${prefix}${lines.join(prefix)}`;
  };

  const helpText = `
---------------------------------------------------------
${description}

Usage: ${renderLines(usageLines)}

Example: ${renderLines(exampleLines)}
---------------------------------------------------------
`;

  console.log(helpText);
  process.exit(1);
};

/**
 * Creates a saveToBackupFile function that uses the supplied filenamePrefix.
 *
 * @param filenamePrefix
 *
 * @example
 *   const saveToDestBackupFile = makeSaveToBackupFile(DEST_PROJECT_ID);
 *   // ..snip..
 *   saveToDestBackupFile(destVenueEvents, `${destVenueRef.id}-events`);
 */
export const makeSaveToBackupFile = (filenamePrefix: string) => (
  data: string | {} | [],
  type: string = "general",
  ext: string = "backup.json"
) => {
  const backupDate = formatDate(new Date(), "yyyyMMdd-HHmmss");
  const backupFilename = `${backupDate}-${filenamePrefix}-${type}.${ext}`;

  const jsonData = JSON.stringify(data, null, 2);

  writeFileSync(backupFilename, jsonData, "utf8");

  console.log(`Saved backup (type='${type}') to ${backupFilename}`);
};

/**
 * Look up a user in Firebase Auth by their email address.
 *
 * @param app Initialised Firebase Admin App instance
 */
export const findUserByEmail = (app: admin.app.App) => (
  email: string
): Promise<admin.auth.UserRecord | undefined> =>
  app
    .auth()
    .getUserByEmail(email)
    .catch(() => undefined);
