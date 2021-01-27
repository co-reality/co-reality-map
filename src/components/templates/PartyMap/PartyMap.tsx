import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { RootState } from "index";
import { createUrlSafeName } from "api/admin";

import { Room } from "types/rooms";
import { PartyMapVenue } from "types/venues";

import { useRecentVenueUsers } from "hooks/users";
import { useSelector } from "hooks/useSelector";
import { useUser } from "hooks/useUser";

import { orderedVenuesSelector } from "utils/selectors";
import { getCurrentTimeInUTCSeconds } from "utils/time";
import { openRoomUrl } from "utils/url";
import { trackRoomEntered } from "utils/useLocationUpdateEffect";

import { Map, RoomModal } from "./components";

import AnnouncementMessage from "components/molecules/AnnouncementMessage/AnnouncementMessage";
import SparkleFairiesPopUp from "components/molecules/SparkleFairiesPopUp/SparkleFairiesPopUp";

import "./PartyMap.scss";

const partyMapVenueSelector = (state: RootState) =>
  state.firestore.ordered.currentVenue?.[0] as PartyMapVenue;

export const PartyMap: React.FC = () => {
  const [isRoomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const { user, profile } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers();

  const currentVenue = useSelector(partyMapVenueSelector);
  const venues = useSelector(orderedVenuesSelector);

  const selectRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
    setRoomModalOpen(true);
  }, []);

  // Note: we explicitly don't unset selectedRoom here as that would cause RoomModal to close abruptly
  const unselectRoom = useCallback(() => {
    setRoomModalOpen(false);
  }, []);

  // TODO: extract this into a reusable hook/similar
  const enterRoom = useCallback(
    (room: Room) => {
      if (!room || !user) return;

      // TODO: we could process this once to make it look uppable directly? What does the data key of venues look like?
      const roomVenue = venues?.find((venue) =>
        room.url.endsWith(`/${venue.id}`)
      );

      const nowInUTCSeconds = getCurrentTimeInUTCSeconds();

      const roomName = {
        [`${currentVenue.name}/${room.title}`]: nowInUTCSeconds,
        ...(roomVenue ? { [currentVenue.name]: nowInUTCSeconds } : {}),
      };

      trackRoomEntered(user, roomName, profile?.lastSeenIn);
      openRoomUrl(room.url);
    },
    [profile, user, currentVenue, venues]
  );

  // Note: since we explicitly don't unset selectedRoom in unselectRoom, we need to check if
  //   the RoomModal is open to know if we have a room selected
  const enterSelectedRoom = useCallback(() => {
    if (!selectedRoom || !isRoomModalOpen) return;

    enterRoom(selectedRoom);
  }, [enterRoom, isRoomModalOpen, selectedRoom]);

  // Find current room from url
  const { roomTitle } = useParams();
  const currentRoom = useMemo(() => {
    if (!currentVenue || !currentVenue.rooms || !roomTitle) return;

    return currentVenue.rooms.find(
      (venueRoom) =>
        createUrlSafeName(venueRoom.title) === createUrlSafeName(roomTitle)
    );
  }, [currentVenue, roomTitle]);

  useEffect(() => {
    if (currentRoom) {
      selectRoom(currentRoom);
    }
  }, [currentRoom, selectRoom]);

  if (!user || !profile?.data) return <>Loading..</>;

  return (
    <div className="party-venue-container">
      <AnnouncementMessage message={currentVenue.bannerMessage} />

      <Map
        user={user}
        profileData={profile.data}
        venue={currentVenue}
        partygoers={recentVenueUsers}
        selectRoom={selectRoom}
        unselectRoom={unselectRoom}
        enterSelectedRoom={enterSelectedRoom}
      />

      <RoomModal
        show={isRoomModalOpen}
        room={selectedRoom}
        onHide={unselectRoom}
      />

      {currentVenue?.config?.showRangers && (
        <div className="sparkle-fairies">
          <SparkleFairiesPopUp />
        </div>
      )}
    </div>
  );
};

export default PartyMap;
