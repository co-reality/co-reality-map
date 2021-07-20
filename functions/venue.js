const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { HttpsError } = require("firebase-functions/lib/providers/https");

const { addAdmin, removeAdmin } = require("./src/api/roles");

const { checkAuth } = require("./src/utils/assert");
const { getVenueId, checkIfValidVenueId } = require("./src/utils/venue");

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
// @debt unify this with ZOOM_URL_TEMPLATES in src/settings.ts + share the same code between frontend/backend
const ZOOM_URL_TEMPLATES = [VenueTemplate.artcar, VenueTemplate.zoomroom];

// @debt unify this with HAS_REACTIONS_TEMPLATES in src/settings.ts + share the same code between frontend/backend
const HAS_REACTIONS_TEMPLATES = [VenueTemplate.audience, VenueTemplate.jazzbar];

// @debt unify this with DEFAULT_SHOW_REACTIONS / DEFAULT_SHOW_SHOUTOUTS in src/settings.ts + share the same code between frontend/backend
const DEFAULT_SHOW_REACTIONS = true;
const DEFAULT_SHOW_SHOUTOUTS = true;

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

// @debt this should be de-duplicated + aligned with createVenueData_v2 to ensure they both cover all needed cases
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
    owners,
    code_of_conduct_questions: data.code_of_conduct_questions || [],
    profile_questions: data.profile_questions,
    entrance: data.entrance || [],
    placement: { ...data.placement, state: PlacementState.SelfPlaced },
    // @debt find a way to share src/settings with backend functions, then use DEFAULT_SHOW_SCHEDULE here
    showSchedule:
      typeof data.showSchedule === "boolean" ? data.showSchedule : true,
    showChat: true,
    showRangers: data.showRangers || false,
    parentId: data.parentId,
    attendeesTitle: data.attendeesTitle || "partygoers",
    chatTitle: data.chatTitle || "Party",
    requiresDateOfBirth: data.requiresDateOfBirth || false,
    userStatuses: data.userStatuses || [],
    showRadio: data.showRadio || false,
    showUserStatus:
      typeof data.showUserStatus === "boolean" ? data.showUserStatus : true,
    radioStations: data.radioStations ? [data.radioStations] : [],
  };

  if (data.mapBackgroundImageUrl) {
    venueData.mapBackgroundImageUrl = data.mapBackgroundImageUrl;
  }

  // @debt showReactions and showShoutouts should be toggleable for anything in HAS_REACTIONS_TEMPLATES
  if (HAS_REACTIONS_TEMPLATES.includes(data.template)) {
    venueData.showReactions =
      typeof data.showReactions === "boolean"
        ? data.showReactions
        : DEFAULT_SHOW_REACTIONS;

    venueData.showShoutouts =
      typeof data.showShoutouts === "boolean"
        ? data.showShoutouts
        : DEFAULT_SHOW_SHOUTOUTS;

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

// @debt this should be de-duplicated + aligned with createVenueData to ensure they both cover all needed cases
const createVenueData_v2 = (data, context) => {
  const venueData_v2 = {
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
  };

  if (HAS_REACTIONS_TEMPLATES.includes(data.template)) {
    venueData_v2.showReactions =
      typeof data.showReactions === "boolean"
        ? data.showReactions
        : DEFAULT_SHOW_REACTIONS;

    venueData_v2.showShoutouts =
      typeof data.showShoutouts === "boolean"
        ? data.showShoutouts
        : DEFAULT_SHOW_SHOUTOUTS;
  }

  return venueData_v2;
};

// @debt refactor function so it doesn't mutate the passed in updated object, but efficiently returns an updated one instead
const createBaseUpdateVenueData = (data, updated) => {
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

  if (data.entrance) {
    updated.entrance = data.entrance;
  }

  if (data.mapBackgroundImageUrl) {
    updated.mapBackgroundImageUrl = data.mapBackgroundImageUrl;
  }

  // @debt do we need to be able to set this here anymore? I think we have a dedicated function for it?
  if (data.bannerMessage) {
    updated.bannerMessage = data.bannerMessage;
  }

  if (data.parentId) {
    updated.parentId = data.parentId;
  }

  if (data.roomVisibility) {
    updated.roomVisibility = data.roomVisibility;
  }

  if (typeof data.showSchedule === "boolean") {
    updated.showSchedule = data.showSchedule;
  }

  if (typeof data.showBadges === "boolean") {
    updated.showBadges = data.showBadges;
  }

  if (typeof data.showRangers === "boolean") {
    updated.showRangers = data.showRangers;
  }

  if (typeof data.showReactions === "boolean") {
    updated.showReactions = data.showReactions;
  }

  if (typeof data.showUserStatus === "boolean") {
    updated.showUserStatus = data.showUserStatus;
  }

  if (typeof data.showShoutouts === "boolean") {
    updated.showShoutouts = data.showShoutouts;
  }

  if (data.userStatuses) {
    updated.userStatuses = data.userStatuses;
  }

  if (data.attendeesTitle) {
    updated.attendeesTitle = data.attendeesTitle;
  }

  if (data.chatTitle) {
    updated.chatTitle = data.chatTitle;
  }

  if (data.code_of_conduct_questions) {
    updated.code_of_conduct_questions = data.code_of_conduct_questions;
  }

  if (data.showNametags) {
    updated.showNametags = data.showNametags;
  }
};

const dataOrUpdateKey = (data, updated, key) =>
  (data && data[key] && typeof data[key] !== "undefined" && data[key]) ||
  (updated &&
    updated[key] &&
    typeof updated[key] !== "undefined" &&
    updated[key]);

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

// @debt this should be de-duplicated + aligned with createVenue_v2 to ensure they both cover all needed cases
exports.createVenue = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  // @debt this should be typed
  const venueData = createVenueData(data, context);
  const venueId = getVenueId(data.name);

  await admin.firestore().collection("venues").doc(venueId).set(venueData);

  return venueData;
});

// @debt this should be de-duplicated + aligned with createVenue to ensure they both cover all needed cases
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

// @debt this is legacy functionality related to the Playa template, and should be cleaned up along with it
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

// @debt this is almost a line for line duplicate of exports.updateVenue_v2, we should de-duplicate/DRY these up
exports.updateVenue = functions.https.onCall(async (data, context) => {
  const venueId = data.id || getVenueId(data.name);
  checkAuth(context);

  // @debt updateVenue_v2 uses checkUserIsAdminOrOwner rather than checkUserIsOwner. Should these be the same? Which is correct?
  await checkUserIsOwner(venueId, context.auth.token.user_id);

  // @debt We should validate venueId conforms to our valid patterns before attempting to use it in a query
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  // @debt this is exactly the same as in updateVenue_v2
  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }

  // @debt this is exactly the same as in updateVenue_v2
  const updated = doc.data();

  // @debt refactor function so it doesn't mutate the passed in updated object, but efficiently returns an updated one instead
  createBaseUpdateVenueData(data, updated);

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  if (data.bannerImageUrl || data.subtitle || data.description) {
    if (!updated.config) {
      updated.config = {};
    }
    if (!updated.config.landingPageConfig) {
      updated.config.landingPageConfig = {};
    }
  }

  // @debt in updateVenue_v2 this is configured as:
  //   updated.config.landingPageConfig.coverImageUrl = data.bannerImageUrl
  //     Should they be the same? If so, which is correct?
  if (data.bannerImageUrl) {
    updated.config.landingPageConfig.bannerImageUrl = data.bannerImageUrl;
  }

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  //   I expect this may be legacy functionality related to the Playa template?
  // if (
  //   !data.placement.state ||
  //   data.placement.state === PlacementState.SelfPlaced
  // ) {
  //   updated.placement = {
  //     ...data.placement,
  //     state: PlacementState.SelfPlaced,
  //   };
  // } else if (data.placementRequests) {
  //   updated.placementRequests = data.placementRequests;
  // }

  // @debt the logic here differs from updateVenue_v2, which only sets this field when data.showGrid is a boolean
  if (data.columns) {
    updated.columns = data.columns;
  }

  // @debt this is almost the same as in updateVenue_v2, though v2 includes data.columns within this if as well
  if (typeof data.showGrid === "boolean") {
    updated.showGrid = data.showGrid;
  }

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  if (data.auditoriumColumns) {
    updated.auditoriumColumns = data.auditoriumColumns;
  }

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  if (data.auditoriumRows) {
    updated.auditoriumRows = data.auditoriumRows;
  }

  // @debt this is almost the same as in updateVenue_v2, though v2 includes data.radioStations within this if as well
  if (typeof data.showRadio === "boolean") {
    updated.showRadio = data.showRadio;
  }

  // @debt the logic here differs from updateVenue_v2, which only sets this field when data.showRadio is a boolean
  if (data.radioStations) {
    updated.radioStations = [data.radioStations];
  }

  // @debt the logic here differs from updateVenue_v2,
  // @debt this would currently allow any value to be set in this field, not just booleans
  updated.requiresDateOfBirth = data.requiresDateOfBirth || false;

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  if (IFRAME_TEMPLATES.includes(updated.template) && data.iframeUrl) {
    updated.iframeUrl = data.iframeUrl;
  }

  // @debt this is missing from updateVenue_v2, why is that? Do we need it there/here?
  if (ZOOM_URL_TEMPLATES.includes(updated.template) && data.zoomUrl) {
    updated.zoomUrl = data.zoomUrl;
  }

  // @debt this is exactly the same as in updateVenue_v2
  await admin.firestore().collection("venues").doc(venueId).update(updated);
});

// @debt this is almost a line for line duplicate of exports.updateVenue, we should de-duplicate/DRY these up
exports.updateVenue_v2 = functions.https.onCall(async (data, context) => {
  const venueId = getVenueId(data.name);
  checkAuth(context);

  // @debt updateVenue uses checkUserIsOwner rather than checkUserIsAdminOrOwner. Should these be the same? Which is correct?
  await checkUserIsOwner(venueId, context.auth.token.user_id);

  // @debt We should validate venueId conforms to our valid patterns before attempting to use it in a query
  const doc = await admin.firestore().collection("venues").doc(venueId).get();

  // @debt this is exactly the same as in updateVenue
  if (!doc || !doc.exists) {
    throw new HttpsError("not-found", `Venue ${venueId} not found`);
  }

  // @debt this is exactly the same as in updateVenue
  const updated = doc.data();

  // @debt refactor function so it doesn't mutate the passed in updated object, but efficiently returns an updated one instead
  createBaseUpdateVenueData(data, updated);

  // @debt in updateVenue we're checking/creating the updated.config object here if needed.
  //   Should we also be doing that here in updateVenue_v2? If not, why don't we need to?

  // @debt in updateVenue this is configured as:
  //   updated.config.landingPageConfig.bannerImageUrl = data.bannerImageUrl
  //     Should they be the same? If so, which is correct?
  if (data.bannerImageUrl) {
    updated.config.landingPageConfig.coverImageUrl = data.bannerImageUrl;
  }

  // @debt aside from the data.columns part, this is exactly the same as in updateVenue
  if (typeof data.showGrid === "boolean") {
    updated.showGrid = data.showGrid;
    // @debt the logic here differs from updateVenue, as data.columns is always set when present there
    updated.columns = data.columns;
  }

  // @debt the logic here differs from updateVenue
  if (typeof data.requiresDateOfBirth === "boolean") {
    updated.requiresDateOfBirth = data.requiresDateOfBirth;
  }

  // @debt aside from the data.radioStations part, this is exactly the same as in updateVenue
  if (typeof data.showRadio === "boolean") {
    updated.showRadio = data.showRadio;
    // @debt the logic here differs from updateVenue, as data.radioStations is always set when present there
    updated.radioStations = [data.radioStations];
  }

  // @debt this is exactly the same as in updateVenue
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
      .update({ banner: data.banner || null });
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
