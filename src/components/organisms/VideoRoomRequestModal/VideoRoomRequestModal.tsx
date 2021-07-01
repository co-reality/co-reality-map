import React, { useCallback, useMemo } from "react";
import { useHistory } from "react-router";

import { acceptVideoRoomInvite, setVideoRoomState } from "api/videoRoom";

import { useConnectVideoRooms } from "hooks/useConnectVideoRooms";
import { useVenueId } from "hooks/useVenueId";
import { useWorldUserById } from "hooks/users";
import { useUser } from "hooks/useUser";

import { hasElements } from "utils/types";
import { WithId } from "utils/id";

import { VideoRoomRequestState } from "types/videoRoom";
import { User } from "types/User";

import { ConfirmationModal } from "components/atoms/ConfirmationModal/ConfirmationModal";
import { UserAvatar } from "components/atoms/UserAvatar";

import "./VideoRoomRequestModal.scss";

export const VideoRoomRequestModal: React.FC = () => {
  const { user } = useUser();
  const userId = user?.uid ?? "";

  const videoRoomRequests = useConnectVideoRooms(userId);
  const history = useHistory();
  const venueId = useVenueId();

  const hasVideoRoomRequests = hasElements(videoRoomRequests);

  const currentVideoRoomRequest = useMemo(
    () => (hasVideoRoomRequests ? videoRoomRequests[0] : undefined),
    [hasVideoRoomRequests, videoRoomRequests]
  );

  const host = useWorldUserById(currentVideoRoomRequest?.hostUserId);

  const acceptVideoRoomRequest = useCallback(() => {
    if (!currentVideoRoomRequest || !venueId) return;

    acceptVideoRoomInvite(currentVideoRoomRequest.id, venueId);
    history.push(`/pr/${currentVideoRoomRequest.id}`);
  }, [currentVideoRoomRequest, history, venueId]);

  const declineVideoRoomRequest = useCallback(() => {
    if (!currentVideoRoomRequest) return;

    setVideoRoomState(
      currentVideoRoomRequest.id,
      VideoRoomRequestState.declined
    );
  }, [currentVideoRoomRequest]);

  if (!currentVideoRoomRequest || !host) {
    return null;
  }

  const hostWithId: WithId<User> = {
    ...host,
    id: currentVideoRoomRequest.hostUserId,
  };

  return (
    <ConfirmationModal
      show={hasVideoRoomRequests}
      message={"wants to video chat with you!"}
      confirmButtonTitle={"Join video chat"}
      cancelButtonTitle={"Decline"}
      onConfirm={acceptVideoRoomRequest}
      onCancel={declineVideoRoomRequest}
    >
      <div className="VideoRoomRequestModal__host-info">
        <UserAvatar user={hostWithId} large />
        <div className="VideoRoomRequestModal__host-title">
          {host?.partyName}
        </div>
      </div>
    </ConfirmationModal>
  );
};
