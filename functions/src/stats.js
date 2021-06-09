// TODO: Rename this file to stats.ts (or stats/index.ts) + refactor to make proper use of TypeScript

const admin = require("firebase-admin");
const functions = require("firebase-functions");

const MAX_TRANSIENT_EVENT_DURATION_HOURS = 6; // transient events are a maximum of 6 hours

// Someone snuck by our client side validation! Naughty naughty!
const sanitizeEvent = (event, now) => {
  if (event.start_utc_seconds && isNaN(event.start_utc_seconds)) {
    event.start_utc_seconds = now / 1000;
  }
  return event;
};

const eventIsNow = (event, now) => {
  const nowSeconds = now / 1000;
  return (
    nowSeconds > event.start_utc_seconds &&
    nowSeconds < 60 * event.duration_minutes + event.start_utc_seconds
  );
};

// @debt This function will currently load all venues in firebase into memory.. not very efficient
exports.getOnlineStats = functions.https.onCall(async () => {
  const now = new Date().getTime();

  let openVenues = [];
  const venues = await admin.firestore().collection("venues").get();
  await Promise.all(
    venues.docs.map(async (venue) => {
      const template = venue.data().template;
      const openWithoutEvents =
        template === "artpiece" || template === "themecamp";
      const events = await venue.ref.collection("events").get();

      const currentEvents = events.docs
        .map((event) => event.data())
        .filter((event) => eventIsNow(event, now));
      const venueOpen = currentEvents.length > 0;

      if (venueOpen || openWithoutEvents) {
        const venueWithId = venue.data();
        venueWithId.id = venue.id;
        openVenues.push({
          venue: venueWithId,
          currentEvents: currentEvents,
        });
      }
    })
  );
  return { openVenues };
});

const eventIsLiveOrInFuture = (event, now) => {
  const nowSeconds = now / 1000;

  const eventIsTransient =
    event.duration_minutes <= MAX_TRANSIENT_EVENT_DURATION_HOURS * 60;

  const eventIsInFuture = nowSeconds < event.start_utc_seconds;

  const eventEndSeconds = 60 * event.duration_minutes + event.start_utc_seconds;
  const eventIsNow = !eventIsInFuture && nowSeconds < eventEndSeconds;

  return eventIsTransient && (eventIsInFuture || eventIsNow);
};

exports.getAllEvents = functions.https.onCall(async () => {
  throw new functions.https.HttpsError(
    "outdated",
    "use getLiveAndFutureEvents instead"
  );
});

// @debt This function will currently load all venues in firebase into memory.. not very efficient
exports.getLiveAndFutureEvents = functions.https.onCall(async () => {
  try {
    const now = new Date().getTime();

    let openVenues = [];
    const venues = await admin.firestore().collection("venues").get();
    await Promise.all(
      venues.docs.map(async (venue) => {
        try {
          const events = await venue.ref.collection("events").get();
          const liveAndFutureEvents = events.docs
            .map((eventRef) => sanitizeEvent(eventRef.data(), now))
            .filter((event) => eventIsLiveOrInFuture(event, now));

          if (!liveAndFutureEvents) return;

          const venueWithId = { ...venue.data(), id: venue.id };
          openVenues.push({
            venue: venueWithId,
            currentEvents: liveAndFutureEvents,
          });
        } catch (e) {
          throw new functions.https.HttpsError("internal", e.toString());
        }
      })
    );

    return { openVenues };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.toString());
  }
});
