// TODO: Rename this file to video.ts (or video/index.ts) + refactor to make proper use of TypeScript

const functions = require("firebase-functions");

const twilio = require("twilio");
const AccessToken = twilio.jwt.AccessToken;
const { VideoGrant } = AccessToken;

const PROJECT_ID = functions.config().project.id;
const TWILIO_CONFIG = functions.config().twilio;

const generateToken = () => {
  return new AccessToken(
    TWILIO_CONFIG.account_sid,
    TWILIO_CONFIG.api_key,
    TWILIO_CONFIG.api_secret
  );
};

const videoToken = (identity, room) => {
  const videoGrant = new VideoGrant({ room });
  const token = generateToken();
  token.addGrant(videoGrant);
  token.identity = identity;
  return token;
};

exports.getToken = functions.https.onCall((data, context) => {
  if (!context.auth || !context.auth.token) {
    throw new functions.https.HttpsError("unauthenticated", "Please log in");
  }

  if (context.auth.token.aud !== PROJECT_ID) {
    throw new functions.https.HttpsError("permission-denied", "Token invalid");
  }

  if (data && data.identity && data.room) {
    const token = videoToken(data.identity, data.room);
    return {
      token: token.toJwt(),
    };
  }

  throw new functions.https.HttpsError(
    "invalid-argument",
    "identity or room data missing"
  );
});
