import Bugsnag from "@bugsnag/js";
import firebase from "firebase/app";

import { VideoRoomRequest, VideoRoomRequestState } from "types/videoRoom";

export const inviteToVideoRoom = async (
  hostUserId: string,
  hostUserLocation: string,
  invitedUserId: string
): Promise<firebase.functions.HttpsCallableResult> => {
  const videoRoomRequest: VideoRoomRequest = {
    hostUserId: hostUserId,
    hostUserLocation: hostUserLocation,
    invitedUserId: invitedUserId,
    state: VideoRoomRequestState.invited,
    createdAt: (firebase.firestore.FieldValue.serverTimestamp() as unknown) as number,
  };

  return await firebase
    .functions()
    .httpsCallable("videoRoom-inviteToVideoRoom")({
      videoRoomRequest,
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/videoRoom::inviteToVideoRoom",
          videoRoomRequest,
        });
      });
      throw err;
    });
};

export const setVideoRoomState = async (
  videoRoomId: string,
  state: VideoRoomRequestState
): Promise<firebase.functions.HttpsCallableResult> => {
  return await firebase
    .functions()
    .httpsCallable("videoRoom-setVideoRoomState")({
      videoRoomId,
      state,
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/videoRoom::setVideoRoomState",
          videoRoomId,
          state,
        });
      });
      throw err;
    });
};

export const acceptVideoRoomInvite = async (
  videoRoomId: string,
  invitedUserLocation: string
): Promise<firebase.functions.HttpsCallableResult> => {
  return await firebase
    .functions()
    .httpsCallable("videoRoom-acceptVideoRoomRequest")({
      state: VideoRoomRequestState.accepted,
      videoRoomId,
      invitedUserLocation,
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/videoRoom::acceptVideoRoom",
          videoRoomId,
          invitedUserLocation,
        });
      });
      throw err;
    });
};
