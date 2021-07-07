import Bugsnag from "@bugsnag/js";
import firebase from "firebase/app";

export interface GetTwilioVideoTokenProps {
  userId: string;
  roomName: string;
}

export type VideoToken = string;

export const getTwilioVideoToken = async ({
  userId,
  roomName,
}: GetTwilioVideoTokenProps): Promise<VideoToken> => {
  return firebase
    .functions()
    .httpsCallable("video-getTwilioToken")({
      identity: userId,
      room: roomName,
    })
    .then<VideoToken>((res) => res.data.token)
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/video::getTwilioVideoToken",
          userId,
          roomName,
        });
      });

      throw err;
    });
};

export interface GetAgoraTokenProps {
  channelName: string;
}

export interface AgoraTokenData {
  appId: string;
  channelName: string;
  account: string;
  token: string;
}

export const getAgoraToken = async ({
  channelName,
}: GetAgoraTokenProps): Promise<AgoraTokenData> => {
  return firebase
    .functions()
    .httpsCallable("video-getAgoraToken")({
      channelName,
    })
    .then<AgoraTokenData>((result) => {
      const { appId, channelName, account, token } = result.data;

      return { appId, channelName, account, token };
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/video::getAgoraToken",
          channelName,
        });
      });

      throw err;
    });
};
