// TODO: Rename this file to access.ts (or access/index.ts) + refactor to make proper use of TypeScript

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { HttpsError } = require("firebase-functions/lib/providers/https");
const { passwordsMatch } = require("./auth");
const { uuid } = require("uuidv4");

const checkIsValidToken = async (venueId, uid, token) => {
  if (!venueId || !uid || !token) return false;

  const venueRef = admin.firestore().collection("venues").doc(venueId);
  const accessRef = admin.firestore().collection("accessgranted").doc(uid);

  return await admin
    .firestore()
    .runTransaction(async (transaction) => {
      const [venue, granted] = await Promise.all([
        transaction.get(venueRef),
        transaction.get(accessRef),
      ]);

      if (!venue.exists || !granted.exists) {
        return false;
      }

      // @debt Add additional password check to see if it has changed.
      const grantedToken = granted.get(token);
      if (grantedToken) {
        // @debt Add timelimit, concept of token expiration.
        const newToken = {
          [token]: {
            ...grantedToken,
            usedAt: Date.now(),
          },
        };

        // @debt Do this only when isTokenChecked is expired or doesn't exist
        transaction.update(accessRef, newToken);

        return true;
      }

      return false;
    })
    .catch(() => {
      return false;
    });
};

const getAccessDoc = async (venueId, method) => {
  if (!venueId || !method) {
    return undefined;
  }
  const venue = await admin.firestore().collection("venues").doc(venueId).get();
  if (!venue.exists) {
    throw new HttpsError("not-found", `venue ${venueId} does not exist`);
  }
  const accessDoc = await venue.ref.collection("access").doc(method).get();
  return accessDoc;
};

const isValidPassword = async (venueId, password) => {
  if (!venueId || !password) return false;

  const access = await getAccessDoc(venueId, "Password");

  if (!access || !access.exists || !access.data().password) {
    return false;
  }

  return passwordsMatch(access.data().password, password);
};

const isValidEmail = async (venueId, email) => {
  if (!venueId || !email) return false;

  const access = await getAccessDoc(venueId, "Emails");

  if (!access || !access.exists || !access.data().emails) {
    return false;
  }

  console.log(access.data().emails);

  return access.data().emails.includes(email.trim().toLowerCase());
};

const isValidCode = async (venueId, code) => {
  if (!venueId || !code) return false;

  const access = getAccessDoc(venueId, "Code");

  if (!access || !access.exists || !access.data().codes) {
    return false;
  }

  return access.data().codes.includes(code.trim());
};

const createToken = async (venueId, uid, password, email, code) => {
  if (!venueId || !uid || (!password && !email && !code)) return undefined;

  const venueRef = admin.firestore().collection("venues").doc(venueId);
  const accessRef = admin.firestore().collection("accessgranted").doc(uid);

  return await admin
    .firestore()
    .runTransaction(async (transaction) => {
      const [venue, granted] = await Promise.all([
        transaction.get(venueRef),
        transaction.get(accessRef),
      ]);

      if (!venue.exists) {
        throw new HttpsError("not-found", `venue ${venueId} does not exist`);
      }

      const token = uuid();

      const tokenData = {
        usedAt: [Date.now()],
        ...(password && { password }),
        ...(email && { email }),
        ...(code && { code }),
      };

      const newToken = { [token]: tokenData };
      if (granted.exists) {
        transaction.update(accessRef, newToken);
      } else {
        transaction.set(accessRef, newToken);
      }

      return token;
    })
    .catch(() => {
      return undefined;
    });
};

exports.checkIsEmailWhitelisted = functions.https.onCall(async (data) =>
  isValidEmail(data.venueId, data.email)
);

exports.checkAccess = functions.https.onCall(async (data, context) => {
  if (!data || !context) return { token: undefined };

  if (
    context &&
    context.auth &&
    context.auth.uid &&
    (await checkIsValidToken(data.venueId, context.auth.uid, data.token))
  ) {
    return { token: data.token };
  }

  const [isPasswordValid, isEmailValid, isCodeValid] = await Promise.all([
    isValidPassword(data.venueId, data.password),
    isValidEmail(data.venueId, data.email),
    isValidCode(data.venueId, data.code),
  ]);

  if (isPasswordValid || isEmailValid || isCodeValid) {
    const token = await createToken(
      data.venueId,
      context.auth.uid,
      data.password,
      data.email,
      data.code
    );
    return { token: token || undefined };
  }

  return { token: undefined };
});
