const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { checkAuth } = require("./auth");
const {
  VideoRoomStateSchema,
  AcceptVideoRoomRequestSchema,
  VideoRoomInviteSchema,
} = require("./src/types/videoRoom");
const { checkIfValidVideoRoomId } = require("./src/utils/videoRoom");

exports.setVideoRoomState = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const isValidVideoRoomId = checkIfValidVideoRoomId(data.videoRoomId);

  if (!isValidVideoRoomId) {
    throw new HttpsError(
      "invalid-argument",
      `videoRoomId is not a valid video room id`
    );
  }

  VideoRoomStateSchema.validate(data).catch((error) => {
    functions.logger.error(
      "VideoRoomStateSchema validation failed",
      data,
      error
    );

    throw new HttpsError(
      "internal",
      "data is invalid, the video room id or the state provided is not valid"
    );
  });

  const { videoRoomId, state } = data;

  return admin
    .firestore()
    .collection("videoRooms")
    .doc(videoRoomId)
    .update({ state });
});

exports.acceptVideoRoomRequest = functions.https.onCall(
  async (data, context) => {
    checkAuth(context);

    const isValidVideoRoomId = checkIfValidVideoRoomId(data.videoRoomId);

    if (!isValidVideoRoomId) {
      throw new HttpsError(
        "invalid-argument",
        `videoRoomId is not a valid video room id`
      );
    }

    AcceptVideoRoomRequestSchema.validate(data).catch((error) => {
      functions.logger.error(
        "AcceptVideoRoomRequestSchema validation failed",
        data,
        error
      );

      throw new HttpsError(
        "internal",
        "data is invalid, the video room id, state or invited user location provided is not valid"
      );
    });

    const { videoRoomId, state, invitedUserLocation } = data;

    return admin
      .firestore()
      .collection("videoRooms")
      .doc(videoRoomId)
      .update({ state, invitedUserLocation });
  }
);

exports.inviteToVideoRoom = functions.https.onCall(async (data, context) => {
  checkAuth(context);

  const isValidVideoRoomId = checkIfValidVideoRoomId(data.videoRoomId);

  if (!isValidVideoRoomId) {
    throw new HttpsError(
      "invalid-argument",
      `videoRoomId is not a valid video room id`
    );
  }

  VideoRoomInviteSchema.validate(data).catch((error) => {
    functions.logger.error(
      "VideoRoomInviteSchema validation failed",
      data,
      error
    );

    throw new HttpsError(
      "internal",
      "data is invalid, the video room id or video room request provided is not valid"
    );
  });

  const videoRoomRequest = data.videoRoomRequest;

  return admin
    .firestore()
    .collection("videoRooms")
    .add(videoRoomRequest)
    .then((response) => response.id);
});
