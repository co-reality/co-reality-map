const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { checkAuth } = require("./auth");
const { HttpsError } = require("firebase-functions/lib/providers/https");

const PLAYA_VENUE_ID = "jamonline";

// These represent all of our venue templates (they should remain alphabetically sorted, deprecated should be separate from the rest)
// @debt unify this with VenueTemplate in src/types/venues.ts + share the same code between frontend/backend
const VenueTemplate = {
  artcar: "artcar",
  artpiece: "artpiece",
  audience: "audience",
  conversationspace: "conversationspace",
  embeddable: "embeddable",
  firebarrel: "firebarrel",
  friendship: "friendship",
  jazzbar: "jazzbar",
  partymap: "partymap",
  animatemap: "animatemap",
  performancevenue: "performancevenue",
  playa: "playa",
  posterhall: "posterhall",
  posterpage: "posterpage",
  preplaya: "preplaya",
  screeningroom: "screeningroom",
  themecamp: "themecamp",
  zoomroom: "zoomroom",

  /**
   * @deprecated Legacy template removed, perhaps try VenueTemplate.partymap instead?
   */
  avatargrid: "avatargrid",
};

const DEFAULT_PRIMARY_COLOR = "#bc271a";

// These templates are allowed to be used with createVenueData (they should remain alphabetically sorted)
const VALID_CREATE_TEMPLATES = [
  VenueTemplate.artcar,
  VenueTemplate.artpiece,
  VenueTemplate.audience,
  VenueTemplate.conversationspace,
  VenueTemplate.embeddable,
  VenueTemplate.firebarrel,
  VenueTemplate.friendship,
  VenueTemplate.jazzbar,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
  VenueTemplate.performancevenue,
  VenueTemplate.themecamp,
  VenueTemplate.zoomroom,
];

// These templates use iframeUrl (they should remain alphabetically sorted)
// @debt unify this with IFRAME_TEMPLATES in src/settings.ts + share the same code between frontend/backend
const IFRAME_TEMPLATES = [
  VenueTemplate.artpiece,
  VenueTemplate.audience,
  VenueTemplate.embeddable,
  VenueTemplate.firebarrel,
  VenueTemplate.jazzbar,
  VenueTemplate.performancevenue,
];

// These templates use zoomUrl (they should remain alphabetically sorted)
// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
const ZOOM_URL_TEMPLATES = [VenueTemplate.artcar, VenueTemplate.zoomroom];

const PlacementState = {
  SelfPlaced: "SELF_PLACED",
  AdminPlaced: "ADMIN_PLACED",
  Hidden: "HIDDEN",
};

const checkUserIsOwner = async (venueId, uid) => {
  await admin
    .firestore()
    .collection("venues")
    .doc(venueId)
    .get()
    .then(async (doc) => {
      if (!doc.exists) {
        throw new HttpsError("not-found", `Venue ${venueId} does not exist`);
      }
      const venue = doc.data();
      if (venue.owners && venue.owners.includes(uid)) return;

      if (venue.parentId) {
        const doc = await admin
          .firestore()
          .collection("venues")
          .doc(venue.parentId)
          .get();

        if (!doc.exists) {
          throw new HttpsError(
            "not-found",
            `Venue ${venueId} references missing parent ${venue.parentId}`
          );
        }
        const parentVenue = doc.data();
        if (!(parentVenue.owners && parentVenue.owners.includes(uid))) {
          throw new HttpsError(
            "permission-denied",
            `User is not an owner of ${venueId} nor parent ${venue.parentId}`
          );
        }
      }

      throw new HttpsError(
        "permission-denied",
        `User is not an owner of ${venueId}`
      );
    })
    .catch((err) => {
      throw new HttpsError(
        "internal",
        `Error occurred obtaining venue ${venueId}: ${err.toString()}`
      );
    });
};

// @debt extract this into a new functions/chat backend script file
const checkIfUserHasVoted = async (venueId, pollId, userId) => {
  await admin
    .firestore()
    .collection("venues")
    .doc(venueId)
    .collection("chats")
    .doc(pollId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        throw new HttpsError("not-found", `Poll ${pollId} does not exist`);
      }

      const poll = doc.data();

      return poll.votes.some(
        ({ userId: existingUserId }) => userId === existingUserId
      );
    })
    .catch((err) => {
      throw new HttpsError(
        "internal",
        `Error occurred obtaining venue ${venueId}: ${err.toString()}`
      );
    });
};

const checkUserIsAdminOrOwner = async (venueId, uid) => {
  try {
    return await checkUserIsOwner(venueId, uid);
  } catch (e) {
    return e.toString();
  }
};

const createVenueData = (data, context) => {
  if (!VALID_CREATE_TEMPLATES.includes(data.template)) {
    throw new HttpsError(
      "invalid-argument",
      `Template ${data.template} unknown`
    );
  }

  let owners = [context.auth.token.user_id];
  if (data.owners) {
    owners = [...owners, ...data.owners];
  }

  const venueData = {
    template: data.template,
    name: data.name,
    config: {
      landingPageConfig: {
        checkList: [],
        coverImageUrl: data.bannerImageUrl,
        subtitle: data.subtitle,
        description: data.description,
      },
    },
    presentation: [],
    quotations: [],
    theme: {
      primaryColor: data.primaryColor || DEFAULT_PRIMARY_COLOR,
    },
    host: {
      icon: data.logoImageUrl,
    },
    code_of_conduct_questions: [],
    owners,
    profile_questions: data.profile_questions,
    placement: { ...data.placement, state: PlacementState.SelfPlaced },
    showLiveSchedule: data.showLiveSchedule ? data.showLiveSchedule : false,
    showChat: true,
    showRangers: data.showRangers || false,
    parentId: data.parentId,
    attendeesTitle: data.attendeesTitle || "partygoers",
    chatTitle: data.chatTitle || "Party",
    requiresDateOfBirth: data.requiresDateOfBirth || false,
    showRadio: data.showRadio || false,
    radioStations: data.radioStations ? [data.radioStations] : [],
  };

  if (data.mapBackgroundImageUrl) {
    venueData.mapBackgroundImageUrl = data.mapBackgroundImageUrl;
  }

  if (data.template === VenueTemplate.audience) {
    venueData.showReactions = data.showReactions;

    if (data.auditoriumColumns) {
      venueData.auditoriumColumns = data.auditoriumColumns;
    }

    if (data.auditoriumRows) {
      venueData.auditoriumRows = data.auditoriumRows;
    }
  }

  if (IFRAME_TEMPLATES.includes(data.template)) {
    venueData.iframeUrl = data.iframeUrl;
  }

  if (ZOOM_URL_TEMPLATES.includes(data.template)) {
    venueData.zoomUrl = data.zoomUrl;
  }

  switch (data.template) {
    case VenueTemplate.animatemap:
    case VenueTemplate.partymap:
    case VenueTemplate.themecamp:
      venueData.rooms = data.rooms;
      venueData.roomVisibility = data.roomVisibility;
      venueData.showGrid = data.showGrid ? data.showGrid : false;
      break;

    case VenueTemplate.playa:
      venueData.roomVisibility = data.roomVisibility;
      break;

    default:
      break;
  }

  return venueData;
};

const createVenueData_v2 = (data, context) => ({
  name: data.name,
  config: {
    landingPageConfig: {
      coverImageUrl: data.bannerImageUrl,
      subtitle: data.subtitle,
      description: data.description,
    },
  },
  theme: {
    primaryColor: data.primaryColor || DEFAULT_PRIMARY_COLOR,
  },
  host: {
    icon: data.logoImageUrl,
  },
  owners: [context.auth.token.user_id],
  showGrid: data.showGrid || false,
  ...(data.showGrid && { columns: data.columns }),
  template: data.template || VenueTemplate.partymap,
  rooms: [],
});

const getVenueId = (name) => {
  return name.replace(/\W/g, "").toLowerCase();
};

const checkIfValidVenueId = (venueId) => /[a-z0-9_]{1,250}/.test(venueId);

const dataOrUpdateKey = (data, updated, key) =>
  (data && data[key] && typeof data[key] !== "undefined" && data[key]) ||
  (updated &&
    updated[key] &&
    typeof updated[key] !== "undefined" &&
    updated[key]);

/** Add a user to the list of admins
 *
 * @param {string} newAdminId
 */
const addAdmin = async (newAdminId) => {
  await admin
    .firestore()
    .collection("roles")
    .doc("admin")
    .update({
      users: admin.firestore.FieldValue.arrayUnion(newAdminId),
    });
};

/** Remove a user from the list of admins
 *
 * @param {string} adminId
 */
const removeAdmin = async (adminId) => {
  await admin
    .firestore()
    .collection("roles")
    .doc("admin")
    .update({
      users: admin.firestore.FieldValue.arrayRemove(adminId),
    });
};

exports.addVenueOwner = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const { venueId, newOwnerId } = data;

  await checkUserIsOwner(venueId, context.auth.token.user_id);

  await admin
    .firestore()
    .collection("venues")
    .doc(venueId)
    .update({
      owners: admin.firestore.FieldValue.arrayUnion(newOwnerId),
    });

  // When adding a user to the list of owners,
  // the user is also added to the list of admins in the "roles" collection
  await addAdmin(newOwnerId);
});

exports.removeVenueOwner = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const { venueId, ownerId } = data;
  await checkUserIsOwner(venueId, context.auth.token.user_id);

  await admin
    .firestore()
    .collection("venues")
    .doc(venueId)
    .update({
      owners: admin.firestore.FieldValue.arrayRemove(ownerId),
    });

  // If a user is not an owner of any venue,
  // remove the user from the list of admins
  const snap = await admin
    .firestore()
    .collection("venues")
    .where("owners", "array-contains", ownerId)
    .get();
  if (snap.empty) removeAdmin(ownerId);
});

exports.createVenue = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  // @debt this should be typed
  const venueData = createVenueData(data, context);
  const venueId = getVenueId(data.name);

  await admin.firestore().collection("venues").doc(venueId).set(venueData);

  return venueData;
});

exports.createVenue_v2 = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const venueData = createVenueData_v2(data, context);
  const venueId = getVenueId(data.name);

  await admin.firestore().collection("venues").doc(venueId).set(venueData);

  return venueData;
});

exports.upsertRoom = functions.https.onCall(async (data, context) => {
  checkAuth(context);
  const { venueId, roomIndex, room } = data;
  await checkUserIsOwner(venueId, context.auth.token.user_id);
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }
  const docData = doc.data();
  let rooms = docData.rooms;

  if (typeof roomIndex !== "number") {
    rooms = [...rooms, room];
  } else {
    rooms[roomIndex] = room;
  }

  admin.firestore().collection("venues").doc(venueId).update({ rooms });
});

exports.deleteRoom = functions.https.onCall(async (data, context) => {
  checkAuth(context);
  const { venueId, room } = data;
  await checkUserIsOwner(venueId, context.auth.token.user_id);
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }
  const docData = doc.data();
  const rooms = docData.rooms;

  //if the room exists under the same name, find it
  const index = rooms.findIndex((val) => val.title === room.title);
  if (index === -1) {
    throw new HttpsError("not-found", "Room does not exist");
  } else {
    docData.rooms.splice(index, 1);
  }

  admin.firestore().collection("venues").doc(venueId).update(docData);
});

exports.toggleDustStorm = functions.https.onCall(async (_data, context) => {
  checkAuth(context);

  await checkUserIsOwner(PLAYA_VENUE_ID, context.auth.token.user_id);

  const doc = await admin
    .firestore()
    .collection("venues")
    .doc(PLAYA_VENUE_ID)
    .get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${PLAYA_VENUE_ID} not found`);
  }
  const updated = doc.data();
  updated.dustStorm = !updated.dustStorm;
  await admin
    .firestore()
    .collection("venues")
    .doc(PLAYA_VENUE_ID)
    .update(updated);

  // Prevent dust storms lasting longer than one minute, even if the playa admin closes their tab.
  // Fetch the doc again, in case anything changed meanwhile.
  // This ties up firebase function execution time, but it would suck to leave the playa in dustStorm mode for hours.
  // Firebase functions time out after 60 seconds by default, so make this last 50 seconds to be safe
  if (updated.dustStorm) {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(50 * 1000);
    const doc = await admin
      .firestore()
      .collection("venues")
      .doc(PLAYA_VENUE_ID)
      .get();

    if (doc && doc.exists) {
      const updated = doc.data();
      updated.dustStorm = false;
      admin
        .firestore()
        .collection("venues")
        .doc(PLAYA_VENUE_ID)
        .update(updated);
    }
  }
});

exports.updateVenue = functions.https.onCall(async (data, context) => {
  const venueId = data.id || getVenueId(data.name);
  checkAuth(context);

  await checkUserIsOwner(venueId, context.auth.token.user_id);

  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }

  const updated = doc.data();

  if (data.bannerImageUrl || data.subtitle || data.description) {
    if (!updated.config) {
      updated.config = {};
    }
    if (!updated.config.landingPageConfig) {
      updated.config.landingPageConfig = {};
    }
  }

  if (data.bannerImageUrl) {
    updated.config.landingPageConfig.bannerImageUrl = data.bannerImageUrl;
  }

  if (data.subtitle) {
    updated.config.landingPageConfig.subtitle = data.subtitle;
  }

  if (data.description) {
    updated.config.landingPageConfig.description = data.description;
  }

  if (data.primaryColor) {
    if (!updated.theme) {
      updated.theme = {};
    }
    updated.theme.primaryColor = data.primaryColor;
  }

  if (data.logoImageUrl) {
    if (!updated.host) {
      updated.host = {};
    }
    updated.host.icon = data.logoImageUrl;
  }

  if (data.profile_questions) {
    updated.profile_questions = data.profile_questions;
  }

  if (data.mapBackgroundImageUrl) {
    updated.mapBackgroundImageUrl = data.mapBackgroundImageUrl;
  }

  if (
    !data.placement.state ||
    data.placement.state === PlacementState.SelfPlaced
  ) {
    updated.placement = {
      ...data.placement,
      state: PlacementState.SelfPlaced,
    };
  } else if (data.placementRequests) {
    updated.placementRequests = data.placementRequests;
  }

  if (data.bannerMessage) {
    updated.bannerMessage = data.bannerMessage;
  }

  if (data.parentId) {
    updated.parentId = data.parentId;
  }

  if (data.columns) {
    updated.columns = data.columns;
  }

  if (data.roomVisibility) {
    updated.roomVisibility = data.roomVisibility;
  }

  if (typeof data.showLiveSchedule === "boolean") {
    updated.showLiveSchedule = data.showLiveSchedule;
  }

  if (typeof data.showGrid === "boolean") {
    updated.showGrid = data.showGrid;
  }

  if (typeof data.showBadges === "boolean") {
    updated.showBadges = data.showBadges;
  }

  if (typeof data.showZendesk === "boolean") {
    updated.showZendesk = data.showZendesk;
  }

  if (typeof data.showRangers === "boolean") {
    updated.showRangers = data.showRangers;
  }

  if (typeof data.showReactions === "boolean") {
    updated.showReactions = data.showReactions;
  }

  if (data.attendeesTitle) {
    updated.attendeesTitle = data.attendeesTitle;
  }

  if (data.chatTitle) {
    updated.chatTitle = data.chatTitle;
  }

  if (data.auditoriumColumns) {
    updated.auditoriumColumns = data.auditoriumColumns;
  }

  if (data.auditoriumRows) {
    updated.auditoriumRows = data.auditoriumRows;
  }

  if (data.profile_questions) {
    updated.profile_questions = data.profile_questions;
  }

  if (data.code_of_conduct_questions) {
    updated.code_of_conduct_questions = data.code_of_conduct_questions;
  }

  if (typeof data.showRadio === "boolean") {
    updated.showRadio = data.showRadio;
  }

  if (data.radioStations) {
    updated.radioStations = [data.radioStations];
  }

  // @debt this would currently allow any value to be set in this field, not just booleans
  updated.requiresDateOfBirth = data.requiresDateOfBirth || false;

  if (IFRAME_TEMPLATES.includes(updated.template) && data.iframeUrl) {
    updated.iframeUrl = data.iframeUrl;
  }

  if (ZOOM_URL_TEMPLATES.includes(updated.template) && data.zoomUrl) {
    updated.zoomUrl = data.zoomUrl;
  }

  await admin.firestore().collection("venues").doc(venueId).update(updated);
});

exports.updateVenue_v2 = functions.https.onCall(async (data, context) => {
  const venueId = getVenueId(data.name);
  checkAuth(context);

  await checkUserIsAdminOrOwner(venueId, context.auth.token.user_id);

  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }

  const updated = doc.data();

  if (data.bannerImageUrl) {
    updated.config.landingPageConfig.coverImageUrl = data.bannerImageUrl;
  }

  if (data.subtitle) {
    updated.config.landingPageConfig.subtitle = data.subtitle;
  }

  if (data.description) {
    updated.config.landingPageConfig.description = data.description;
  }

  if (data.primaryColor) {
    if (!updated.theme) {
      updated.theme = {};
    }
    updated.theme.primaryColor = data.primaryColor;
  }

  if (data.logoImageUrl) {
    if (!updated.host) {
      updated.host = {};
    }
    updated.host.icon = data.logoImageUrl;
  }

  if (data.parentId) {
    updated.parentId = data.parentId;
  }

  if (typeof data.showGrid === "boolean") {
    updated.showGrid = data.showGrid;
    updated.columns = data.columns;
  }

  if (typeof data.showLiveSchedule === "boolean") {
    updated.showLiveSchedule = data.showLiveSchedule;
  }

  if (typeof data.showBadges === "boolean") {
    updated.showBadges = data.showBadges;
  }

  if (typeof data.showZendesk === "boolean") {
    updated.showZendesk = data.showZendesk;
  }

  if (typeof data.showRangers === "boolean") {
    updated.showRangers = data.showRangers;
  }

  if (typeof data.showReactions === "boolean") {
    updated.showReactions = data.showReactions;
  }

  if (typeof data.requiresDateOfBirth === "boolean") {
    updated.requiresDateOfBirth = data.requiresDateOfBirth;
  }

  if (typeof data.showRadio === "boolean") {
    updated.showRadio = data.showRadio;
    updated.radioStations = [data.radioStations];
  }

  if (data.mapBackgroundImageUrl) {
    updated.mapBackgroundImageUrl = data.mapBackgroundImageUrl;
  }

  if (data.roomVisibility) {
    updated.roomVisibility = data.roomVisibility;
  }

  if (data.profile_questions) {
    updated.profile_questions = data.profile_questions;
  }

  if (data.code_of_conduct_questions) {
    updated.code_of_conduct_questions = data.code_of_conduct_questions;
  }

  if (data.entrance) {
    updated.entrance = data.entrance;
  }

  if (data.attendeesTitle) {
    updated.attendeesTitle = data.attendeesTitle;
  }

  if (data.chatTitle) {
    updated.chatTitle = data.chatTitle;
  }

  if (data.bannerMessage) {
    updated.bannerMessage = data.bannerMessage;
  }

  admin.firestore().collection("venues").doc(venueId).update(updated);
});

exports.updateTables = functions.https.onCall((data, context) => {
  checkAuth(context);

  const isValidVenueId = checkIfValidVenueId(data.venueId);

  if (!isValidVenueId) {
    throw new HttpsError("invalid-argument", `venueId is not a valid venue id`);
  }

  const venueRef = admin.firestore().collection("venues").doc(data.venueId);

  return admin.firestore().runTransaction(async (transaction) => {
    const venueDoc = await transaction.get(venueRef);

    if (!venueDoc.exists) {
      throw new HttpsError("not-found", `venue ${venueId} does not exist`);
    }

    const venueTables = [...data.tables];

    const currentTableIndex = venueTables.findIndex(
      (table) => table.reference === data.updatedTable.reference
    );

    if (currentTableIndex < 0) {
      throw new HttpsError(
        "not-found",
        `current table does not exist in the venue`
      );
    }

    venueTables[currentTableIndex] = data.updatedTable;

    transaction.update(venueRef, { "config.tables": venueTables });
  });
});

exports.deleteVenue = functions.https.onCall(async (data, context) => {
  const venueId = getVenueId(data.id);
  checkAuth(context);

  await checkUserIsOwner(venueId, context.auth.token.user_id);

  admin.firestore().collection("venues").doc(venueId).delete();
});

// @debt extract this into a new functions/chat backend script file
exports.voteInPoll = functions.https.onCall(
  async ({ venueId, pollVote }, context) => {
    checkAuth(context);

    const { pollId, questionId } = pollVote;

    try {
      await checkIfUserHasVoted(venueId, pollId, context.auth.token.user_id);

      const newVote = {
        questionId,
        userId: context.auth.token.user_id,
      };

      admin
        .firestore()
        .collection("venues")
        .doc(venueId)
        .collection("chats")
        .doc(pollId)
        .update({
          votes: admin.firestore.FieldValue.arrayUnion(newVote),
        });
    } catch (error) {
      throw new HttpsError(
        "has-voted",
        `User ${userId} has voted in ${pollId} Poll`,
        error
      );
    }
  }
);

exports.adminUpdatePlacement = functions.https.onCall(async (data, context) => {
  const venueId = data.id;
  checkAuth(context);
  await checkUserIsOwner(PLAYA_VENUE_ID, context.auth.token.user_id);
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }
  const updated = doc.data();
  updated.placement = {
    x: dataOrUpdateKey(data.placement, updated.placement, "x"),
    y: dataOrUpdateKey(data.placement, updated.placement, "y"),
    state: PlacementState.AdminPlaced,
  };

  updated.width = data.width;
  updated.height = data.height;

  const addressText = dataOrUpdateKey(
    data.placement,
    updated.placement,
    "addressText"
  );
  const notes = dataOrUpdateKey(data.placement, updated.placement, "notes");

  if (addressText) {
    updated.placement.addressText = addressText;
  }
  if (notes) {
    updated.placement.notes = notes;
  }

  admin.firestore().collection("venues").doc(venueId).update(updated);
});

exports.adminHideVenue = functions.https.onCall(async (data, context) => {
  const venueId = data.id;
  checkAuth(context);
  await checkUserIsOwner(PLAYA_VENUE_ID, context.auth.token.user_id);
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }
  const updated = doc.data();
  updated.placement.state = PlacementState.Hidden;
  admin.firestore().collection("venues").doc(venueId).update(updated);
});

exports.adminUpdateBannerMessage = functions.https.onCall(
  async (data, context) => {
    await checkUserIsOwner(data.venueId, context.auth.token.user_id);
    await admin
      .firestore()
      .collection("venues")
      .doc(data.venueId)
      .update({ bannerMessage: data.bannerMessage || null });
  }
);

exports.adminUpdateIframeUrl = functions.https.onCall(async (data, context) => {
  const { venueId, iframeUrl } = data;
  await checkUserIsOwner(venueId, context.auth.token.user_id);
  await admin
    .firestore()
    .collection("venues")
    .doc(venueId)
    .update({ iframeUrl: iframeUrl || null });
});

exports.getOwnerData = functions.https.onCall(async ({ userId }) => {
  const user = (
    await admin.firestore().collection("users").doc(userId).get()
  ).data();

  return user;
});

exports.setVenueLiveStatus = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const isValidVenueId = checkIfValidVenueId(data.venueId);

  if (!isValidVenueId) {
    throw new HttpsError("invalid-argument", `venueId is not a valid venue id`);
  }

  if (typeof data.isLive !== "boolean") {
    throw new HttpsError("invalid-argument", `isLive is not a boolean`);
  }

  const update = {
    isLive: Boolean(data.isLive),
  };

  await admin.firestore().collection("venues").doc(data.venueId).update(update);
});
