import { useCallback, useEffect, useState } from "react";
import AgoraRTC, { ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";

import { AGORA_APP_ID, AGORA_CHANNEL, AGORA_TOKEN } from "secrets";

import {
  UseAgoraScreenShareProps,
  UseAgoraScreenShareReturn,
} from "types/agora";
import { ReactHook } from "types/utility";

import { updateTalkShowStudioExperience } from "api/profile";

import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";

export const useAgoraScreenShare: ReactHook<
  UseAgoraScreenShareProps,
  UseAgoraScreenShareReturn
> = ({ client }) => {
  const { userId } = useUser();
  const venueId = useVenueId();

  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack>();
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack>();

  const stopShare = useCallback(async () => {
    if (!venueId || !userId) return;

    updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        isSharingScreen: false,
      },
    });

    localScreenTrack?.stop();
    localScreenTrack?.close();

    localAudioTrack?.stop();
    localAudioTrack?.close();

    await client.unpublish();

    setLocalScreenTrack(undefined);
    setLocalAudioTrack(undefined);
  }, [venueId, userId, client, localAudioTrack, localScreenTrack]);

  const leaveChannel = useCallback(async () => {
    stopShare();
    await client.leave();
  }, [client, stopShare]);

  const shareScreen = useCallback(async () => {
    const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
    // We add a check since there is no "on" method in screenTrack types,
    // but in fact there is one and this is the main way to track browser "Stop sharing" button click.
    if (!screenTrack || !("on" in screenTrack)) return;

    screenTrack.on("track-ended", stopShare);

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
  }, [client, stopShare]);

  const joinChannel = async () => {
    if (!venueId || !userId) return;

    const screenClientUid = await client.join(
      AGORA_APP_ID || "",
      AGORA_CHANNEL || "",
      AGORA_TOKEN || null
    );

    const experience = {
      screenClientUid: `${screenClientUid}`,
    };

    updateTalkShowStudioExperience({ venueId, userId, experience });
  };

  useEffect(() => {
    return () => {
      leaveChannel();
    };
    // Otherwise, it will fire when local tracks are updated
    // @debt We shouldn't be disabling our linting rules like this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localScreenTrack,
    shareScreen,
    stopShare,
    joinChannel,
    leaveChannel,
  };
};
