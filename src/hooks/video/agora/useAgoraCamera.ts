import { useCallback, useEffect, useState } from "react";
import { useUnmount } from "react-use";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";

import { ReactHook } from "types/utility";

import { updateTalkShowStudioExperience } from "api/profile";
import { getAgoraToken } from "api/video";

import { useShowHide } from "hooks/useShowHide";

export interface UseAgoraCameraProps {
  venueId?: string;
  userId?: string;
  channelName?: string;
  client?: IAgoraRTCClient;
}

export interface UseAgoraCameraReturn {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  localCameraTrack?: ILocalVideoTrack;
  toggleCamera(): void;
  toggleMicrophone(): void;
  joinChannel(): Promise<void>;
  leaveChannel(): Promise<void>;
}

export const useAgoraCamera: ReactHook<
  UseAgoraCameraProps,
  UseAgoraCameraReturn
> = ({ venueId, userId, channelName, client }) => {
  const [localCameraTrack, setLocalCameraTrack] = useState<ILocalVideoTrack>();

  const [
    localMicrophoneTrack,
    setLocalMicrophoneTrack,
  ] = useState<ILocalAudioTrack>();

  const {
    isShown: isCameraEnabled,
    show: enableCamera,
    toggle: toggleCamera,
  } = useShowHide();

  const {
    isShown: isMicrophoneEnabled,
    show: enableMicrophone,
    toggle: toggleMicrophone,
  } = useShowHide();

  useEffect(() => {
    localCameraTrack?.setEnabled(isCameraEnabled);
  }, [isCameraEnabled, localCameraTrack]);

  useEffect(() => {
    localMicrophoneTrack?.setEnabled(isMicrophoneEnabled);
  }, [isMicrophoneEnabled, localMicrophoneTrack]);

  const joinChannel = async () => {
    if (!client || !venueId || !userId || !channelName) return;

    const { appId, account, token } = await getAgoraToken({
      channelName,
    });

    const cameraClientUid = await client.join(
      appId,
      channelName,
      token,
      account
    );

    const experience = {
      cameraClientUid: `${cameraClientUid}`,
    };

    updateTalkShowStudioExperience({ venueId, userId, experience });

    enableCamera();
    enableMicrophone();

    const cameraTrack = await AgoraRTC.createCameraVideoTrack();
    const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();

    setLocalCameraTrack(cameraTrack);
    setLocalMicrophoneTrack(microphoneTrack);

    await client.publish([microphoneTrack, cameraTrack]);
  };

  const leaveChannel = useCallback(async () => {
    localCameraTrack?.stop();
    localCameraTrack?.close();

    localMicrophoneTrack?.stop();
    localMicrophoneTrack?.close();

    setLocalCameraTrack(undefined);
    setLocalMicrophoneTrack(undefined);

    await client?.leave();
  }, [client, localCameraTrack, localMicrophoneTrack]);

  useUnmount(async () => {
    await leaveChannel();
  });

  return {
    localCameraTrack,
    toggleCamera,
    toggleMicrophone,
    isCameraEnabled,
    isMicrophoneEnabled,
    joinChannel,
    leaveChannel,
  };
};
