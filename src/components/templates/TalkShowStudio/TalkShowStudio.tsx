import React, { FC, useCallback, useEffect, useMemo } from "react";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";

import { FullTalkShowVenue } from "types/venues";
import { AgoraClientConnectionState } from "types/agora";

import { WithId } from "utils/id";
import { currentVenueSelectorData } from "utils/selectors";

import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { useStage } from "hooks/useStage";
import {
  useAgoraCamera,
  useAgoraRemotes,
  useAgoraScreenShare,
} from "hooks/video/agora";

import AppButton from "components/atoms/Button";
import Player, { VideoPlayerProps } from "./components/Player/Player";
import { ControlBar } from "./components/ControlBar";
import Audience from "./components/Audience/Audience";
import SettingsSidebar from "./components/SettingsSidebar/SettingsSidebar";

import "./TalkShowStudio.scss";

// @debt Should these be created in static scope like this? Are client's meant to be static?
//   Do we need unique clients for each of the modes here?
const agoraClient: IAgoraRTCClient = AgoraRTC.createClient({
  codec: "h264",
  mode: "live",
});

agoraClient.setClientRole("host");

export interface TalkShowStudioProps {
  venue: WithId<FullTalkShowVenue>;
}

export const TalkShowStudio: FC<TalkShowStudioProps> = ({ venue }) => {
  const { userId, profile } = useUser();
  const currentVenue = useSelector(currentVenueSelectorData);

  // @debt retrieve/generate this in a better/more secure way
  const channelName = venue.id;

  const isRequestToJoinStageEnabled = venue.requestToJoinStage;

  const stage = useStage({ venueId: venue.id });

  const remoteUsers = useAgoraRemotes({
    userId,
    channelName,
    client: agoraClient,
  });

  const {
    localCameraTrack,
    toggleCamera,
    toggleMicrophone,
    isCameraEnabled,
    isMicrophoneEnabled,
    joinChannel: cameraClientJoin,
    leaveChannel: cameraClientLeave,
  } = useAgoraCamera({
    venueId: venue.id,
    userId,
    channelName,
    client: agoraClient,
  });

  const {
    localScreenTrack,
    shareScreen,
    stopShare,
    joinChannel: screenClientJoin,
    leaveChannel: screenClientLeave,
  } = useAgoraScreenShare({
    venueId: venue.id,
    userId,
    channelName,
    client: agoraClient,
  });

  const localUser = useMemo(
    () => stage.peopleOnStage.find(({ id }) => id === userId),
    [userId, stage.peopleOnStage]
  );

  const isUserOwner = useMemo(
    () => !!userId && currentVenue?.owners.includes(userId),
    [currentVenue?.owners, userId]
  );

  const [userOnStageSharingScreen] = useMemo(
    () =>
      stage.peopleOnStage.filter(
        ({ data }) => data?.[`${venue.id}`]?.isSharingScreen
      ),
    [stage.peopleOnStage, venue.id]
  );

  const remoteScreenTrack = useMemo(
    () =>
      remoteUsers.find(
        ({ uid }) =>
          `${uid}` ===
          userOnStageSharingScreen?.data?.[`${venue.id}`]?.screenClientUid
      ),
    [userOnStageSharingScreen?.data, remoteUsers, venue.id]
  );

  const remoteCameraTrack = useMemo(
    () =>
      remoteUsers.find(
        ({ uid }) =>
          `${uid}` ===
          userOnStageSharingScreen?.data?.[`${venue.id}`]?.cameraClientUid
      ),
    [userOnStageSharingScreen?.data, remoteUsers, venue.id]
  );

  const remoteUsersPlayers = useMemo(() => {
    const setRemoteUserAvatar = (remoteUserId: number | string) => {
      if (!venue.id) return;

      return stage.peopleOnStage.find(
        ({ data }) =>
          data?.[`${venue.id}`]?.cameraClientUid === `${remoteUserId}`
      );
    };
    return remoteUsers
      .filter(
        ({ uid }) =>
          `${uid}` !==
          userOnStageSharingScreen?.data?.[`${venue.id}`]?.cameraClientUid
      )
      .filter(
        ({ uid }) =>
          `${uid}` !==
          userOnStageSharingScreen?.data?.[`${venue.id}`]?.screenClientUid
      )
      .map(
        (user) =>
          user.uid !== screenClient.uid &&
          user.uid !== cameraClient.uid && (
            <div key={user.uid}>
              {user.hasVideo && (
                <Player
                  showButtons
                  user={setRemoteUserAvatar(user.uid)}
                  videoTrack={user.videoTrack}
                  audioTrack={user.audioTrack}
                  isCamOn={user.hasVideo}
                  isMicOn={user.hasAudio}
                  containerClass="TalkShowStudio__mode--play"
                />
              )}
            </div>
          )
      );
  }, [remoteUsers, venue.id, stage.peopleOnStage, userOnStageSharingScreen]);

  const onStageJoin = useCallback(() => {
    cameraClientJoin();
    screenClientJoin();
    stage.joinStage();
  }, [cameraClientJoin, stage, screenClientJoin]);

  const onStageLeaving = useCallback(() => {
    cameraClientLeave();
    screenClientLeave();
    stage.leaveStage();
  }, [cameraClientLeave, stage, screenClientLeave]);

  useEffect(() => {
    agoraClient.connectionState === AgoraClientConnectionState.DISCONNECTED &&
      stage.isUserOnStage &&
      onStageJoin();

    agoraClient.connectionState === AgoraClientConnectionState.CONNECTED &&
      !stage.isUserOnStage &&
      onStageLeaving();
  }, [stage.isUserOnStage, onStageJoin, onStageLeaving]);

  useEffect(() => {
    !stage.isUserSharing && localScreenTrack && stopShare();
  }, [stage.isUserSharing, localScreenTrack, stopShare]);

  useEffect(() => {
    const isUserMicOff = profile?.data?.[venue.id]?.isMuted;

    if (
      (isUserMicOff && isMicrophoneEnabled) ||
      !(isUserMicOff || isMicrophoneEnabled)
    ) {
      toggleMicrophone();
    }
  }, [isMicrophoneEnabled, profile?.data, toggleMicrophone, venue.id]);

  useEffect(() => {
    const isUserCameraOff = profile?.data?.[venue.id]?.isUserCameraOff;

    if (
      (isUserCameraOff && isCameraEnabled) ||
      !(isUserCameraOff || isCameraEnabled)
    ) {
      toggleCamera();
    }
  }, [isCameraEnabled, profile?.data, toggleCamera, venue.id]);

  const isJoinStageButtonDisplayed =
    isRequestToJoinStageEnabled &&
    stage.canJoinStage &&
    !isUserOwner &&
    !stage.isUserOnStage &&
    !stage.isUserRequesting;

  const renderScreenSharing = (
    screenTrack: VideoPlayerProps["videoTrack"],
    cameraTrack: VideoPlayerProps["videoTrack"]
  ) => {
    if (!screenTrack || !cameraTrack) return;
    return (
      <div className="TalkShowStudio__scene--sharing">
        {screenTrack && (
          <Player
            videoTrack={screenTrack}
            containerClass="TalkShowStudio__mode--share"
          />
        )}
        {cameraTrack && (
          <Player
            user={localUser}
            videoTrack={cameraTrack}
            showButtons
            isCamOn={isCameraEnabled}
            isMicOn={isMicrophoneEnabled}
            isSharing={!!screenTrack}
            toggleCam={toggleCamera}
            toggleMic={toggleMicrophone}
            containerClass="TalkShowStudio__mode--local-play"
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="TalkShowStudio">
        <div className="TalkShowStudio__scene">
          {renderScreenSharing(
            localScreenTrack || remoteScreenTrack?.videoTrack,
            localCameraTrack || remoteCameraTrack?.videoTrack
          )}
          <div className="TalkShowStudio__players">
            {localCameraTrack && !localScreenTrack && (
              <div>
                <Player
                  user={localUser}
                  videoTrack={localCameraTrack}
                  showButtons
                  isCamOn={isCameraEnabled}
                  isMicOn={isMicrophoneEnabled}
                  isSharing={!!localScreenTrack}
                  toggleCam={stage.toggleCamera}
                  toggleMic={stage.toggleMicrophone}
                  containerClass="TalkShowStudio__mode--play"
                />
              </div>
            )}
            {remoteUsersPlayers}
          </div>

          <ControlBar
            isSharing={!!localScreenTrack}
            loading={
              agoraClient.connectionState !==
              AgoraClientConnectionState.CONNECTED
            }
            onStageJoin={onStageJoin}
            onStageLeaving={onStageLeaving}
            shareScreen={shareScreen}
            stopShare={stopShare}
            showJoinStageButton={isUserOwner}
          />
        </div>
        {isJoinStageButtonDisplayed && (
          <AppButton
            customClass="TalkShowStudio__request-button"
            onClick={stage.requestJoinStage}
          >
            <span>✋</span> Request to join
          </AppButton>
        )}
        <Audience venue={venue} />
      </div>
      <SettingsSidebar venue={venue} />
    </>
  );
};
