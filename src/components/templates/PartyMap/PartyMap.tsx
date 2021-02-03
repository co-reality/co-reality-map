import React, { useState, useCallback } from "react";

import { RootState } from "index";

import { Room } from "types/rooms";
import { PartyMapVenue } from "types/venues";

import { useRecentVenueUsers } from "hooks/users";
import { useSelector } from "hooks/useSelector";
import { useUser } from "hooks/useUser";
import useConnectCurrentVenue from "hooks/useConnectCurrentVenue";

import { Map, RoomModal } from "./components";

import SparkleFairiesPopUp from "components/molecules/SparkleFairiesPopUp/SparkleFairiesPopUp";

import "./PartyMap.scss";

const partyMapVenueSelector = (state: RootState) =>
  state.firestore.ordered.currentVenue?.[0] as PartyMapVenue;

export const PartyMap: React.FC = () => {
  useConnectCurrentVenue();
  const { user, profile } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers();

  const currentVenue = useSelector(partyMapVenueSelector);

  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const hasSelectedRoom = !!selectedRoom;

  const selectRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  const unselectRoom = useCallback(() => {
    setSelectedRoom(undefined);
  }, []);

  if (!user || !profile) return <>Loading..</>;

  return (
    <div className="party-venue-container">
      <Map
        user={user}
        profileData={profile.data}
        venue={currentVenue}
        partygoers={recentVenueUsers}
        selectRoom={selectRoom}
        unselectRoom={unselectRoom}
      />

      <RoomModal
        room={selectedRoom}
        currentVenue={currentVenue}
        show={hasSelectedRoom}
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
