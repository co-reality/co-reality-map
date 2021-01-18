import UserProfileModal from "components/organisms/UserProfileModal";
import { RoomModal } from "components/templates/PartyMap/components";
import { useWorldUsers } from "hooks/users";
import { useSelector } from "hooks/useSelector";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CampRoomData } from "types/CampRoomData";
import { User } from "types/User";
import { VenueEvent } from "types/VenueEvent";
import { WithId } from "utils/id";
import { currentVenueSelectorData, venueEventsSelector } from "utils/selectors";
import { isTruthy } from "utils/types";
import "./NavSearchBar.scss";
import { NavSearchBarInput } from "./NavSearchBarInput";

interface SearchResult {
  rooms: CampRoomData[];
  users: readonly WithId<User>[];
  events: VenueEvent[];
}

const NavSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = useMemo(() => searchQuery.toLowerCase(), [
    searchQuery,
  ]);
  const [searchResult, setSearchResult] = useState<SearchResult>({
    rooms: [],
    users: [],
    events: [],
  });
  const [selectedUserProfile, setSelectedUserProfile] = useState<
    WithId<User>
  >();
  const [selectedRoom, setSelectedRoom] = useState<CampRoomData>();

  const venue = useSelector(currentVenueSelectorData);

  const venueEvents = useSelector(venueEventsSelector) ?? [];
  const { worldUsers } = useWorldUsers();

  useEffect(() => {
    if (!normalizedSearchQuery) {
      setSearchResult({
        rooms: [],
        users: [],
        events: [],
      });
      return;
    }
    const venueUsersResults = worldUsers.filter((user) =>
      user.partyName?.toLowerCase()?.includes(normalizedSearchQuery)
    );

    const venueEventsResults = venueEvents.filter((event) =>
      event.name.toLowerCase().includes(normalizedSearchQuery)
    );

    const roomsResults =
      venue && venue.rooms
        ? (venue?.rooms as CampRoomData[]).filter((room) =>
            room.title.toLowerCase().includes(normalizedSearchQuery)
          )
        : [];

    setSearchResult({
      rooms: roomsResults,
      users: venueUsersResults,
      events: venueEventsResults,
    });
  }, [normalizedSearchQuery, venue, venueEvents, worldUsers]);

  const numberOfSearchResults =
    searchResult.rooms.length +
    searchResult.events.length +
    searchResult.users.length;

  const clearSearchQuery = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="nav-search-links">
      <div className="nav-search-icon" />
      <NavSearchBarInput value={searchQuery} onChange={setSearchQuery} />
      {isTruthy(searchQuery) && (
        <div className="nav-search-close-icon" onClick={clearSearchQuery} />
      )}
      {isTruthy(numberOfSearchResults) && (
        <>
          <div className="nav-search-results">
            <div className="nav-search-result-number">
              <b>{numberOfSearchResults}</b> search results
            </div>
            {searchResult.rooms.map((room, index) => {
              return (
                <div
                  className="row"
                  key={`room-${index}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div
                    className="result-avatar"
                    style={{
                      backgroundImage: `url(${room.image_url})`,
                    }}
                  ></div>
                  <div className="result-info">
                    <div className="result-title">{room.title}</div>
                    <div>Room</div>
                  </div>
                </div>
              );
            })}
            {searchResult.events.map((event, index) => {
              return (
                <div className="row" key={`event-${index}`}>
                  <div>
                    <div>{event.name}</div>
                    <div>Event</div>
                  </div>
                </div>
              );
            })}
            {searchResult.users.map((user, index) => {
              return (
                <div
                  className="row"
                  key={`room-${index}`}
                  onClick={() => setSelectedUserProfile(user)}
                >
                  <div
                    className="result-avatar"
                    style={{
                      backgroundImage: `url(${user.pictureUrl})`,
                    }}
                  ></div>
                  <div className="result-info">
                    <div key={`user-${index}`}>{user.partyName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <UserProfileModal
        userProfile={selectedUserProfile}
        show={selectedUserProfile !== undefined}
        onHide={() => setSelectedUserProfile(undefined)}
      />
      <RoomModal
        show={isTruthy(selectedRoom)}
        room={selectedRoom}
        onHide={() => setSelectedRoom(undefined)}
      />
    </div>
  );
};

export default NavSearchBar;
