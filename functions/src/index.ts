import admin from "firebase-admin";
import functions from "firebase-functions";

// TODO: do we need to import firebase here like this, or can we just use it from firebase-admin?
import firebase from "firebase/app";
import "firebase/firestore";

// @debt refactor this into a utils/ folder (if functions can support packaging/bundling that)
import { passwordsMatch } from "./auth";

export * as access from "./access";
export * as payment from "./payment";
export * as stats from "./stats";
export * as venue from "./venue";
export * as video from "./video";

const functionsConfig = functions.config();

// @debt we don't want to log the service key (and possibly other sensitive values) from the functions config here like this
console.log("functions.config()", JSON.stringify(functionsConfig, null, 2));

if (!functionsConfig) throw new Error("failed: functionsConfig missing");
if (!functionsConfig.project)
  throw new Error("failed: functionsConfig.project missing");
if (!functionsConfig.project.id)
  throw new Error("failed: functionsConfig.project.id missing");

const firebaseConfig = {
  projectId: functionsConfig.project.id,
};
firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  ...firebaseConfig,
  credential: admin.credential.cert({
    ...functionsConfig.service_account,
    private_key: functionsConfig.service_account.private_key.replace(
      /\\n/g,
      "\n"
    ),
  }),
});

// @debt is this still used/needed? If so, we should probably refactor it into ./auth
export interface CheckPasswordRequestData {
  // @debt rename this to venueId?
  venue?: string;
  password?: string;
}

// @debt is this still used/needed? If so, we should probably refactor it into ./auth
// @debt we should implement rate limiting/similar on this function if we're going to keep it
export const checkPassword = functions.https.onCall(
  async ({ venue, password }: CheckPasswordRequestData) => {
    // @debt validate that venue is a valid venueId before using it in this query (using Yup?)
    // @debt validate that both a venue and password were provided before trying to query the database with them

    const venueDoc = await firebase
      .firestore()
      .collection("venues")
      .doc(venue)
      .get();

    // @debt Should we do: if (!venueDoc.exists) return error? Or should we just return unauthenticated even when the venueId is wrong to not allow venueIds to be identified?

    const { password: venuePassword } = venueDoc.data() ?? {};

    if (
      typeof password === "string" &&
      typeof venuePassword === "string" &&
      passwordsMatch(password, venuePassword)
    ) {
      return "OK";
    }

    throw new functions.https.HttpsError(
      "unauthenticated",
      "Password incorrect"
    );
  }
);
