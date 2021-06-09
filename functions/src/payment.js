// TODO: Rename this file to payment.ts (or payment/index.ts) + refactor to make proper use of TypeScript

const admin = require("firebase-admin");
const functions = require("firebase-functions");

const PROJECT_ID = functions.config().project.id;
const STRIPE_CONFIG = functions.config().stripe;

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require("stripe")(STRIPE_CONFIG.secret_key);

const PURCHASE_TABLE = "purchases";
const CUSTOMER_TABLE = "customers";

const authenticationCheck = (context) => {
  if (!context.auth || !context.auth.token) {
    throw new functions.https.HttpsError("unauthenticated", "Please log in");
  }

  if (context.auth.token.aud !== PROJECT_ID) {
    throw new functions.https.HttpsError("permission-denied", "Token invalid");
  }
};

const getEventPrice = async (venueId, eventId) => {
  const event = (
    await admin
      .firestore()
      .collection("venues")
      .doc(venueId)
      .collection("events")
      .doc(eventId)
      .get()
  ).data();
  return event.price;
};

exports.createCustomerWithPaymentMethod = functions.https.onCall(
  async (data, context) => {
    authenticationCheck(context);

    if (!data.paymentMethodId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "paymentMethodId data missing"
      );
    }

    const customer = await stripe.customers.create({
      email: context.auth.token.email,
    });

    if (!customer)
      throw new functions.https.HttpsError("unavailable", err.message);

    try {
      await stripe.paymentMethods.attach(data.paymentMethodId, {
        customer: customer.id,
      });
    } catch (err) {
      return { error: err };
    }

    await admin
      .firestore()
      .collection(CUSTOMER_TABLE)
      .doc(context.auth.token.user_id)
      .set({
        userId: context.auth.token.user_id,
        customerId: customer.id,
      });

    return {};
  }
);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  authenticationCheck(context);

  if (
    !(
      data &&
      data.venueId &&
      data.eventId &&
      context.auth.token.email &&
      context.auth.token.user_id
    )
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "venue, event or return url data missing"
    );
  }

  const ticketsBoughtByUserForThisEvent = await admin
    .firestore()
    .collection("purchases")
    .where("userId", "==", context.auth.token.user_id)
    .where("eventId", "==", data.eventId)
    .where("venueId", "==", data.venueId)
    .where("status", "in", [
      "COMPLETE",
      "CONFIRMATION_FROM_STRIPE_PENDING",
      "PROCESSING",
    ])
    .get();

  if (!ticketsBoughtByUserForThisEvent.empty) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "the user already paid for this event"
    );
  }
  let eventPrice;
  try {
    eventPrice = await getEventPrice(data.venueId, data.eventId);
  } catch (err) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "could not retrieve the event price"
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: eventPrice,
    currency: "gbp",
    metadata: { integration_check: "accept_a_payment" },
    receipt_email: context.auth.token.email,
  });

  await admin.firestore().collection(PURCHASE_TABLE).doc(paymentIntent.id).set({
    venueId: data.venueId,
    eventId: data.eventId,
    userId: context.auth.token.user_id,
    status: "INITIALIZED",
  });

  return {
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
  };
});

exports.setPaymentIntentProcessing = functions.https.onCall(
  async (data, context) => {
    authenticationCheck(context);

    if (!(data && data.paymentIntentId)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "payment intent data missing"
      );
    }

    const documentToUpdate = (
      await admin
        .firestore()
        .collection(PURCHASE_TABLE)
        .doc(data.paymentIntentId)
        .get()
    ).data();

    if (["INITIALIZED", "FAILED"].includes(documentToUpdate.status)) {
      await admin
        .firestore()
        .collection(PURCHASE_TABLE)
        .doc(data.paymentIntentId)
        .update({
          status: "PROCESSING",
        });
    }

    return {};
  }
);

exports.setPaymentIntentFailed = functions.https.onCall(
  async (data, context) => {
    authenticationCheck(context);
    if (!(data && data.paymentIntentId)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "payment intent data missing"
      );
    }

    const documentToUpdate = (
      await admin
        .firestore()
        .collection(PURCHASE_TABLE)
        .doc(data.paymentIntentId)
        .get()
    ).data();

    if (documentToUpdate.status === "PROCESSING") {
      await admin
        .firestore()
        .collection(PURCHASE_TABLE)
        .doc(data.paymentIntentId)
        .update({
          status: "FAILED",
        });
    }

    return {};
  }
);

exports.confirmPaymentIntent = functions.https.onCall(async (data, context) => {
  authenticationCheck(context);
  if (!(data && data.paymentIntentId)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "payment intent data missing"
    );
  }

  const documentToUpdate = (
    await admin
      .firestore()
      .collection(PURCHASE_TABLE)
      .doc(data.paymentIntentId)
      .get()
  ).data();

  if (documentToUpdate.status === "PROCESSING") {
    await admin
      .firestore()
      .collection(PURCHASE_TABLE)
      .doc(data.paymentIntentId)
      .update({
        status: "CONFIRMATION_FROM_STRIPE_PENDING",
      });
  }

  return {};
});

const endpointSecret = STRIPE_CONFIG.endpoint_secret;

exports.webhooks = functions.https.onRequest(async (request, res) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Webhook Error: ${err.message}`
    );
  }

  // Handle the charge.succeeded event
  if (event.type === "charge.succeeded") {
    const charge = event.data.object;

    await admin
      .firestore()
      .collection(PURCHASE_TABLE)
      .doc(charge.payment_intent)
      .update({
        status: "COMPLETE",
      });
  } else if (event.type === "charge.failed") {
    const charge = event.data.object;

    await admin
      .firestore()
      .collection(PURCHASE_TABLE)
      .doc(charge.payment_intent)
      .update({
        status: "FAILED",
      });
  }
  // Return a response to acknowledge receipt of the event
  return res.status(200).send({ received: true });
});
