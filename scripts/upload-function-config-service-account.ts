#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import { resolve } from "path";
import { exec } from "child_process";

import {
  ensureProjectIdMatchesCredentialProjectId,
  makeScriptUsage,
  parseCredentialFile,
} from "./lib/helpers";

const usage = makeScriptUsage({
  description: `Uploads service account credentials to firebase function config.

This is most useful when setting up a new environment for the first time.`,
  usageParams: "PROJECT_ID CREDENTIAL_PATH",
  exampleParams:
    "sparkle-example TODO-PROJECT-ID-firebase-adminsdk-abc12-1234567890.json",
});

const [projectId, credentialPath] = process.argv.slice(2);
if (!projectId || !credentialPath) {
  usage();
}

const resolvedCredentialPath = resolve(credentialPath);
const credentialData = parseCredentialFile(resolvedCredentialPath);

ensureProjectIdMatchesCredentialProjectId(projectId, credentialPath);

const configItems = Object.entries(credentialData).map(
  ([key, value]) => `service_account.${key}='${value}'`
);
const configItemsString = configItems.join(" ");

const cmd = `npx firebase --project ${projectId} functions:config:set ${configItemsString}`;

const proc = exec(cmd, (err, stdout) => {
  console.log(stdout);
});

proc.on("close", () => {
  console.log(
    `You can check the full config by running: npx firebase --project ${projectId} functions:config:get`
  );
});
