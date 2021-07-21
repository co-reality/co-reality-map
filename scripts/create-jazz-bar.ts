#!/usr/bin/env node -r esm -r ts-node/register -r tsconfig-paths/register -r ignore-styles

import admin from "firebase-admin";

import { JazzbarVenue, VenueTemplate } from "../src/types/venues";

import { initFirebaseAdminApp, makeScriptUsage } from "./lib/helpers";

const usage = makeScriptUsage({
  description: "Create jazz bar.",
  usageParams:
    "PROJECT_ID VENUE_NAME IFRAME_URL LOGO_IMAGE_URL PROFILE_QUESTIONS CODE_OF_CONDUCT_QUESTIONS",
  exampleParams:
    'co-reality-map jazzyjeff https://youtube.com/embed/abc /logo.png "question1?,question2?" "I will seek out the fun,I will add to the fun"',
});

const [
  projectId,
  name,
  iframeUrl,
  logoImageUrl,
  iconUrl,
  _profileQuestions,
  _codeofConductQuestions,
] = process.argv.slice(2);

if (
  !projectId ||
  !name ||
  !iframeUrl ||
  !logoImageUrl ||
  !iconUrl ||
  !_profileQuestions ||
  !_codeofConductQuestions
) {
  usage();
}

const profile_questions = _profileQuestions
  .split(",")
  .map((q, index) => ({ name: index.toString(), text: q.trim() }));

const code_of_conduct_questions = _codeofConductQuestions
  .split(",")
  .map((q, index) => ({ name: index.toString(), text: q.trim() }));

const jazzbar: JazzbarVenue = {
  template: VenueTemplate.jazzbar,
  name,
  iframeUrl,
  logoImageUrl,
  host: {
    icon: iconUrl,
  },
  profile_questions,
  code_of_conduct_questions,
};

const venueId = name.replace(/\W/g, "").toLowerCase();

initFirebaseAdminApp(projectId);

admin
  .firestore()
  .collection("venues")
  .doc(venueId)
  .get()
  .then((doc) => {
    if (doc.exists) {
      console.error("Error: Trying to create an existing venue");
      process.exit(1);
    }
    admin
      .firestore()
      .collection("venues")
      .doc(venueId)
      .set(jazzbar)
      .then(() => {
        console.log(`Added doc ${venueId}.`);
      });
  });
