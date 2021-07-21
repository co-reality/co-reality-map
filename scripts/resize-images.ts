#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

/*
  To run:

  -
    - ensure accountKey has the correct service account data from firebase
    - ensure projectId is set to co-reality-staging or co-reality-map
    - set BACKUP to true to backup all images from firebase (in logical directory structure)
    - set BACKUP to false to set resize all images to width COMPRESSION_WIDTH_PX and auto height
    - tsconfig.json should contain

{
  "compilerOptions": {
    "target": "ES6",
    "moduleResolution": "Node",
    "traceResolution": false,
    "allowJs": false,
    "esModuleInterop": true,
    "declaration": false,
    "noResolve": false,
    "noImplicitAny": false,
    "removeComments": true,
    "strictNullChecks": false,
    "sourceMap": false,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}

    once configured, in a terminal, run: npx ts-node resize-images.ts
*/

import { resolve } from "path";

import admin from "firebase-admin";
import { uuid } from "uuidv4";
import jimp from "jimp";
import fs from "fs";
import { GifUtil } from "gifwrap";
import p from "phin";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

import { ACCEPTED_IMAGE_TYPES } from "../src/settings";

const usage = makeScriptUsage({
  description: "Backup or resize images (see code comments for further usage)",
  usageParams: "PROJECT_ID [CREDENTIAL_PATH]",
  exampleParams: "co-reality-map [theMatchingAccountServiceKey.json]",
});

const [projectId, credentialPath] = process.argv.slice(2);

// Note: no need to check credentialPath here as initFirebaseAdmin defaults it when undefined
if (!projectId) {
  usage();
}

// Max filesize permitted.
const MAX_SIZE_BYTES = 400 * 1024;

// If true, backup files. If false, run.
const BACKUP = false;

// Add entries here by hand to selectively process problem files.
// By default (with this list empty) script will process all files.
const SELECTIVELY_PROCESS_FILE_NAME_PARTS: string[] = [
  // "BIGFILE.png",
  // "HUGE_ANIMATED_GIF.gif",
];

initFirebaseAdminApp(projectId, {
  credentialPath: credentialPath
    ? resolve(__dirname, credentialPath)
    : undefined,
});

const backupFile = async (
  remotePath: string,
  signedUrl: string,
  contentType: string
) => {
  const backuplocation = `./backup/${remotePath}`;

  if (fs.existsSync(backuplocation)) {
    console.log("file exists", backuplocation);
    return;
  }

  console.log("downloading", backuplocation);

  try {
    const backupDirectoryPath = backuplocation.replace(/[^/]+$/, "");
    fs.mkdirSync(backupDirectoryPath, { recursive: true });

    if (contentType === "image/gif" || remotePath.endsWith("gif")) {
      const response = await p(signedUrl);
      if ("headers" in response && "location" in response.headers) {
        console.error(`Got redirect to ${response.headers.location}; skipping`);
        return;
      }

      if (typeof response.body !== "object" || Buffer.isBuffer(response.body)) {
        const msg =
          "Could not load Buffer from <" +
          signedUrl +
          "> " +
          "(HTTP: " +
          response.statusCode +
          ")";
        console.error(msg);
        return;
      }
      const gifImage = await GifUtil.read(response.body);
      return await GifUtil.write(backuplocation, gifImage.frames, gifImage);
    } else {
      // errors if the image is malformed
      const jimpImage = await jimp.read(signedUrl);
      return await jimpImage.writeAsync(backuplocation);
    }
  } catch (e) {
    console.log(signedUrl);
    console.log(e);
    return;
  }
};

const main = async () => {
  const bucket = admin.storage().bucket();
  console.log("Fetching files from bucket...");
  const res = await bucket.getFiles({ directory: "users" });
  const files = res[0];
  console.log(`Fetched ${files.length} files.`);

  for (const file of files) {
    if (SELECTIVELY_PROCESS_FILE_NAME_PARTS.length > 0) {
      let processFile = false;
      SELECTIVELY_PROCESS_FILE_NAME_PARTS.forEach((filenamepiece) => {
        if (file.name.includes(filenamepiece)) {
          processFile = true;
        }
      });
      const skipFile = !processFile;
      if (skipFile) {
        continue;
      }
    }

    const [signedurl] = await file.getSignedUrl({
      action: "read",
      expires: "10-10-2020",
    });
    console.log("\n\n");

    if (!ACCEPTED_IMAGE_TYPES.includes(file.metadata.contentType)) {
      console.log(
        `Skipping - ${file.metadata.contentType} Not a processible file type`
      );
      continue;
    }

    if (BACKUP) {
      await backupFile(file.name, signedurl, file.metadata.contentType);
      continue;
    }

    const resizeImage = async () => {
      if (file.metadata.size <= MAX_SIZE_BYTES) {
        console.log(
          `Skipping ${file.name} - size is ${file.metadata.size}, <= ${MAX_SIZE_BYTES}`
        );
        return;
      } else {
        console.log(`${file.name} size is ${file.metadata.size} - resizing`);
      }

      const filename = file.name.replace(/^.*[\\/]/, "");
      const resizedFilePath = `./temp/${filename}`;

      if (
        file.metadata.contentType === "image/gif" ||
        file.name.endsWith("gif")
      ) {
        const response = await p(signedurl);
        if ("headers" in response && "location" in response.headers) {
          console.error(
            `Got redirect to ${response.headers.location}; skipping`
          );
          return;
        }

        if (
          typeof response.body !== "object" ||
          !Buffer.isBuffer(response.body)
        ) {
          const msg =
            "Could not load Buffer from <" +
            signedurl +
            "> " +
            "(HTTP: " +
            response.statusCode +
            ")";
          console.error(msg);
          return;
        }
        const gifImage = await GifUtil.read(response.body);
        GifUtil.shareAsJimp(jimp, gifImage.frames[0]).resize(
          Math.floor(gifImage.width / 2),
          jimp.AUTO
        );
        await GifUtil.write(resizedFilePath, [gifImage.frames[0]], gifImage);
      } else {
        const jimpImage = await jimp.read(signedurl);
        jimpImage.resize(Math.floor(jimpImage.getWidth() / 2), jimp.AUTO);
        await jimpImage.writeAsync(resizedFilePath);
      }

      console.log(
        `Wrote temp file for ${signedurl} to ${resizedFilePath}, size: ${
          fs.statSync(resizedFilePath).size
        }`
      );

      await bucket.upload(resizedFilePath, {
        destination: file.name,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuid(),
          },
        },
      });
      console.log(`***** Overwrote ${file.name}`);
      console.log(`Deleting ${resizedFilePath}`);
      fs.unlinkSync(resizedFilePath);
    };

    try {
      await resizeImage();
    } catch (e) {
      console.log("Error", e);
    }
  }
};

main();
