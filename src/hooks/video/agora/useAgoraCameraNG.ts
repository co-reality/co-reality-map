import { useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

import { ReactHook } from "types/utility";

import { useAgoraClient } from "./useAgoraClient";

export interface UseAgoraCameraNGProps {
  channelName?: string;
}

export interface UseAgoraCameraNGReturn {
  localCameraTrack?: ILocalVideoTrack;

  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;

  toggleCamera(): void;
  toggleMicrophone(): void;

  joinChannel: () => Promise<UID | undefined>;
  leaveChannel(): Promise<void>;

  client: IAgoraRTCClient;
}

export const useAgoraCameraNG: ReactHook<
  UseAgoraCameraNGProps,
  UseAgoraCameraNGReturn
> = ({ channelName }) => {
  const {
    client,
    localVideoTrack,
    isVideoTrackEnabled,
    isAudioTrackEnabled,
    toggleVideoTrack,
    toggleAudioTrack,
    enableVideoTrack,
    enableAudioTrack,
    setLocalVideoTrack,
    setLocalAudioTrack,
    joinChannel,
    leaveChannel,
  } = useAgoraClient({ channelName });

  const joinChannelWithCameraAndMic = useCallback(async () => {
    const channelId = await joinChannel();

    // const cameraTrack = await AgoraRTC.createCameraVideoTrack();
    // const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();

    const [
      microphoneTrack,
      cameraTrack,
    ] = await AgoraRTC.createMicrophoneAndCameraTracks();

    setLocalVideoTrack(cameraTrack);
    setLocalAudioTrack(microphoneTrack);

    await client.publish([microphoneTrack, cameraTrack]);

    enableVideoTrack();
    enableAudioTrack();

    return channelId;
  }, [
    client,
    enableAudioTrack,
    enableVideoTrack,
    joinChannel,
    setLocalAudioTrack,
    setLocalVideoTrack,
  ]);

  return {
    client,

    localCameraTrack: localVideoTrack,

    isCameraEnabled: isVideoTrackEnabled,
    toggleCamera: toggleVideoTrack,

    isMicrophoneEnabled: isAudioTrackEnabled,
    toggleMicrophone: toggleAudioTrack,

    joinChannel: joinChannelWithCameraAndMic,
    leaveChannel,
  };
};
