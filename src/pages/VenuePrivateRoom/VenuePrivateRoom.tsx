import React, { useCallback } from "react";
import { useParams } from "react-router";

import { setVideoRoomState } from "api/videoRoom";
import { sendPrivateMessage } from "api/chat";

import { useCurrentVideoRoom } from "hooks/useCurrentVideoRoom";
import { useUser } from "hooks/useUser";
import { useShowHide } from "hooks/useShowHide";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";

import { VideoRoomRequestState } from "types/videoRoom";

import { enterVenue } from "utils/url";

import Room from "components/organisms/Room";
import WithNavigationBar from "components/organisms/WithNavigationBar";
import { NotificationModal } from "components/atoms/NotificationModal";
import { ConfirmationModal } from "components/atoms/ConfirmationModal/ConfirmationModal";
import { ChatSidebar } from "components/organisms/ChatSidebar";

import "./VenuePrivateRoom.scss";
import { buildMessage } from "utils/chat";
import { PrivateChatMessage } from "types/chat";

export interface VenuePrivateRoomParams {
  roomId: string;
}

export const VenuePrivateRoom: React.FC = () => {
  const { user } = useUser();
  const { roomId } = useParams<VenuePrivateRoomParams>();
  const { videoRoom } = useCurrentVideoRoom(roomId);
  const { isShown, show, hide } = useShowHide();

  const venueId =
    user?.uid === videoRoom?.hostUserId
      ? videoRoom?.hostUserLocation
      : videoRoom?.invitedUserLocation;

  const navigateToVenue = useCallback(() => {
    if (!venueId || !videoRoom) return;

    enterVenue(venueId);
  }, [venueId, videoRoom]);

  const backToVenue = useCallback(() => {
    if (!venueId) return;

    if (videoRoom && videoRoom.state === VideoRoomRequestState.accepted) {
      const message = buildMessage<PrivateChatMessage>({
        text: "",
        from: videoRoom.hostUserId,
        isVideo: true,
        to: videoRoom.invitedUserId,
      });
      sendPrivateMessage(message);
      setVideoRoomState(roomId, VideoRoomRequestState.expired);
    }
    enterVenue(venueId);
  }, [roomId, venueId, videoRoom]);

  const { currentVenue: venue } = useConnectCurrentVenueNG(venueId);

  if (!videoRoom) {
    return null;
  }

  const isInviteDeclined = videoRoom.state === VideoRoomRequestState.declined;

  return (
    <WithNavigationBar hasBackButton={false} venueId={venueId}>
      <Room roomName={roomId} />
      <div className="back-map-btn" onClick={show}>
        <div className="back-icon" />
        <span className="back-link">Back{venueId ? ` to ${venueId}` : ""}</span>
      </div>
      <ConfirmationModal
        show={isShown}
        message={"Are you sure you want to leave the video chat?"}
        confirmButtonTitle={"Leave video chat"}
        cancelButtonTitle={"Cancel"}
        onConfirm={backToVenue}
        onCancel={hide}
      />
      {venue && <ChatSidebar venue={venue} />}
      {isInviteDeclined && (
        <NotificationModal
          message={"Your video chat request was declined. "}
          buttonTitle={`Back to ${venueId}`}
          onConfirm={navigateToVenue}
        />
      )}
    </WithNavigationBar>
  );
};
