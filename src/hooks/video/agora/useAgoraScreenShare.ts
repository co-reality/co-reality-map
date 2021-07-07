import { useCallback, useState } from "react";
import { useUnmount } from "react-use";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";

import { ReactHook } from "types/utility";

import { updateTalkShowStudioExperience } from "api/profile";
import { getAgoraToken } from "api/video";

export interface UseAgoraScreenShareProps {
  venueId?: string;
  userId?: string;
  channelName?: string;
  client?: IAgoraRTCClient;
}

export interface UseAgoraScreenShareReturn {
  localScreenTrack?: ILocalVideoTrack;
  stopShare(): void;
  shareScreen(): Promise<void>;
  joinChannel(): Promise<void>;
  leaveChannel(): Promise<void>;
}

export const useAgoraScreenShare: ReactHook<
  UseAgoraScreenShareProps,
  UseAgoraScreenShareReturn
> = ({ venueId, userId, channelName, client }) => {
  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack>();
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack>();

  const shareScreen = useCallback(async () => {
    if (!client) return;

    const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");

    if (Array.isArray(screenTrack)) {
      const [screenVideoTrack, screenAudioTrack] = screenTrack;

      setLocalScreenTrack(screenVideoTrack);
      setLocalAudioTrack(screenAudioTrack);

      await client.publish(screenVideoTrack);
      await client.publish(screenAudioTrack);

      return;
    }

    setLocalScreenTrack(screenTrack);
    await client.publish(screenTrack);
  }, [client]);

  const stopShare = useCallback(async () => {
    localScreenTrack?.stop();
    localScreenTrack?.close();

    localAudioTrack?.stop();
    localAudioTrack?.close();

    await client?.unpublish();

    setLocalScreenTrack(undefined);
    setLocalAudioTrack(undefined);
  }, [client, localAudioTrack, localScreenTrack]);

  const joinChannel = async () => {
    if (!client || !venueId || !userId || !channelName) return;

    const { appId, account, token } = await getAgoraToken({
      channelName,
    });

    const screenClientUid = await client?.join(
      appId,
      channelName,
      token,
      account
    );

    const experience = {
      screenClientUid: `${screenClientUid}`,
    };

    updateTalkShowStudioExperience({ venueId, userId, experience });
  };

  const leaveChannel = useCallback(async () => {
    stopShare();
    await client?.leave();
  }, [client, stopShare]);

  useUnmount(async () => {
    await leaveChannel();
  });

  return {
    localScreenTrack,
    shareScreen,
    stopShare,
    joinChannel,
    leaveChannel,
  };
};
