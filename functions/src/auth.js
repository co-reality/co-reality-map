// TODO: Rename this file to auth.ts (or auth/index.ts) + refactor to make proper use of TypeScript

const functions = require("firebase-functions");
const PROJECT_ID = functions.config().project.id;

exports.checkAuth = (context) => {
  if (!context.auth || !context.auth.token) {
    throw new functions.https.HttpsError("unauthenticated", "Please log in");
  }

  if (context.auth.token.aud !== PROJECT_ID) {
    throw new functions.https.HttpsError("permission-denied", "Token invalid");
  }
};

// Case-insensitive first character for iDevices
const lowercaseFirstChar = (password) =>
  password.charAt(0).toLowerCase() + password.substring(1);

exports.passwordsMatch = (submittedPassword, actualPassword) =>
  submittedPassword.trim() === actualPassword.trim() ||
  lowercaseFirstChar(submittedPassword.trim()) ===
    lowercaseFirstChar(actualPassword.trim());
