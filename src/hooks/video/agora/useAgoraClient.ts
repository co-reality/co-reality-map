import { useEffect, useMemo, useState } from "react";
import { useAsyncFn, useUnmount } from "react-use";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

import { ReactHook } from "types/utility";

import { getAgoraToken } from "api/video";

import { useShowHide } from "hooks/useShowHide";

export interface UseAgoraClientProps {
  channelName?: string;
}

export interface UseAgoraClientData {
  client: IAgoraRTCClient;

  joinChannel: () => Promise<UID | undefined>;
  isJoiningChannel: boolean;
  channelUid?: UID;

  leaveChannel: () => Promise<void>;
  isLeavingChannel: boolean;

  localVideoTrack?: ILocalVideoTrack;
  setLocalVideoTrack: (localVideoTrack: ILocalVideoTrack) => void;

  localAudioTrack?: ILocalAudioTrack;
  setLocalAudioTrack: (localAudioTrack: ILocalAudioTrack) => void;

  isVideoTrackEnabled: boolean;
  enableVideoTrack: () => void;
  disableVideoTrack: () => void;
  toggleVideoTrack: () => void;

  isAudioTrackEnabled: boolean;
  enableAudioTrack: () => void;
  disableAudioTrack: () => void;
  toggleAudioTrack: () => void;
}

export const useAgoraClient: ReactHook<
  UseAgoraClientProps,
  UseAgoraClientData
> = ({ channelName }) => {
  const client = useMemo(() => {
    const client = AgoraRTC.createClient({
      codec: "h264",
      mode: "live",
    });

    // TODO: handle this somewhere better
    client.setClientRole("host");

    return client;
  }, []);

  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack>();
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack>();

  const {
    isShown: isVideoTrackEnabled,
    show: enableVideoTrack,
    hide: disableVideoTrack,
    toggle: toggleVideoTrack,
  } = useShowHide();

  const {
    isShown: isAudioTrackEnabled,
    show: enableAudioTrack,
    hide: disableAudioTrack,
    toggle: toggleAudioTrack,
  } = useShowHide();

  useEffect(() => {
    localVideoTrack?.setEnabled(isVideoTrackEnabled);
  }, [isVideoTrackEnabled, localVideoTrack]);

  useEffect(() => {
    localAudioTrack?.setEnabled(isAudioTrackEnabled);
  }, [isAudioTrackEnabled, localAudioTrack]);

  // TODO: Should we just move channelName to a prop/param of joinChannel?
  const [
    { loading: isJoiningChannel, value: channelUid },
    joinChannel,
  ] = useAsyncFn(async () => {
    if (!client || !channelName || client.connectionState !== "DISCONNECTED")
      return;

    const {
      appId,
      channelName: tokenChannelName,
      token,
      account,
    } = await getAgoraToken({ channelName });

    return client.join(appId, tokenChannelName, token, account);
  });

  const [{ loading: isLeavingChannel }, leaveChannel] = useAsyncFn(async () => {
    setLocalVideoTrack(undefined);
    setLocalAudioTrack(undefined);

    if (!client) return;

    client.localTracks.map((track) => track.stop());
    client.localTracks.map((track) => track.close());

    return client.leave();
  });

  useUnmount(async () => {
    await leaveChannel();
  });

  return {
    client,

    joinChannel,
    isJoiningChannel,
    channelUid,

    leaveChannel,
    isLeavingChannel,

    localVideoTrack,
    setLocalVideoTrack,

    localAudioTrack,
    setLocalAudioTrack,

    isVideoTrackEnabled,
    enableVideoTrack,
    disableVideoTrack,
    toggleVideoTrack,

    isAudioTrackEnabled,
    enableAudioTrack,
    disableAudioTrack,
    toggleAudioTrack,
  };
};
