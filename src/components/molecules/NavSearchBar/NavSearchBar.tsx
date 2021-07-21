import React, { useCallback, useState, ChangeEvent, useMemo } from "react";
import classNames from "classnames";
import { isEqual, reduce } from "lodash";

import { faSearch } from "@fortawesome/free-solid-svg-icons";

import {
  DEFAULT_PARTY_NAME,
  DEFAULT_VENUE_LOGO,
  COVERT_ROOM_TYPES,
} from "settings";

import { Room } from "types/rooms";
import { AnyVenue, VenueEvent } from "types/venues";

import { WithVenueId } from "utils/id";
import { uppercaseFirstChar } from "utils/string";
import { formatUtcSecondsRelativeToNow } from "utils/time";
import { isTruthy, isDefined } from "utils/types";

import { useVenueEvents } from "hooks/events";
import { useWorldUsers } from "hooks/users";
import { useDebounceSearch } from "hooks/useDebounceSearch";
import { useProfileModalControls } from "hooks/useProfileModalControls";
import { useRelatedVenues } from "hooks/useRelatedVenues";

import { RoomModal } from "components/templates/PartyMap/components";
import { EventModal } from "components/organisms/EventModal";
import { Loading } from "components/molecules/Loading";
import {
  NavSearchList,
  NavSearchListItem,
} from "components/molecules/NavSearchBar/NavSearchList";
import { InputField } from "components/atoms/InputField";

import navDropdownCloseIcon from "assets/icons/nav-dropdown-close.png";

import "./NavSearchBar.scss";

export interface NavSearchBarProps {
  venueId: string;
}

export const NavSearchBar: React.FC<NavSearchBarProps> = ({ venueId }) => {
  const {
    searchInputValue,
    searchQuery,
    setSearchInputValue,
    clearSearch,
  } = useDebounceSearch();

  const onSearchInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchInputValue(e.target.value);
    },
    [setSearchInputValue]
  );

  const [selectedRoom, setSelectedRoom] = useState<Room>();
  const hideRoomModal = useCallback(() => setSelectedRoom(undefined), []);

  const [selectedRoomVenue, setSelectedRoomVenue] = useState<AnyVenue>();

  const [selectedEvent, setSelectedEvent] = useState<WithVenueId<VenueEvent>>();
  const hideEventModal = useCallback(() => setSelectedEvent(undefined), []);

  const { isLoading, relatedVenues, relatedVenueIds } = useRelatedVenues({
    currentVenueId: venueId,
  });

  const enabledRelatedRooms = useMemo<Room[]>(
    () =>
      relatedVenues
        .flatMap((venue) => venue.rooms ?? [])
        .filter((room) => {
          if (isDefined(room.type) && COVERT_ROOM_TYPES.includes(room.type)) {
            return false;
          }

          return room.isEnabled;
        }),
    [relatedVenues]
  );

  const enabledRelatedRoomsByTitle = useMemo<Partial<Record<string, Room>>>(
    () =>
      reduce(
        enabledRelatedRooms,
        (enabledRelatedRoomsByTitle, room) => ({
          ...enabledRelatedRoomsByTitle,
          [room.title]: room,
        }),
        {}
      ),
    [enabledRelatedRooms]
  );

  const { isEventsLoading, events: relatedEvents } = useVenueEvents({
    venueIds: relatedVenueIds,
  });

  const foundRooms = useMemo<NavSearchListItem[]>(() => {
    if (!searchQuery) return [];

    /* @debt we really shouldn't be using the index as part of the key here, it's unstable.. but rooms don't have a unique identifier */
    return (
      enabledRelatedRooms
        .filter((room) => room.title.toLowerCase().includes(searchQuery))
        .map((room, index) => ({
          key: `room-${room.title}-${index}`,
          title: room.title,
          description: "Room",
          image: room.image_url,
          onClick: () => {
            setSelectedRoom(room);
            // @debt we need to find room venue (selectedRoomVenue) because of RoomModal -> useRoom -> externalRoomSlug (which accepts venueName as a parameter)
            //  probably would be better to extend Room type with the venueId it's related to, and use it in the `externalRoomSlug` instead of venueName
            setSelectedRoomVenue(
              relatedVenues.find((venue) =>
                venue.rooms?.filter((venueRoom) => isEqual(venueRoom, room))
              )
            );

            clearSearch();
          },
        })) ?? []
    );
  }, [searchQuery, enabledRelatedRooms, clearSearch, relatedVenues]);

  const { worldUsers } = useWorldUsers();
  const { openUserProfileModal } = useProfileModalControls();

  const foundUsers = useMemo<NavSearchListItem[]>(() => {
    if (!searchQuery) return [];

    return worldUsers
      .filter((user) => user.partyName?.toLowerCase().includes(searchQuery))
      .map((user) => ({
        key: `user-${user.id}`,
        title: user.partyName ?? DEFAULT_PARTY_NAME,
        user: user,
        onClick: () => {
          openUserProfileModal(user);
          clearSearch();
        },
      }));
  }, [searchQuery, worldUsers, clearSearch, openUserProfileModal]);

  const foundEvents = useMemo<NavSearchListItem[]>(() => {
    if (!searchQuery) return [];

    return relatedEvents
      .filter((event) => {
        const isEventRoomEnabled =
          isDefined(event.room) && event.room !== ""
            ? isDefined(enabledRelatedRoomsByTitle[event.room])
            : true;

        return (
          isEventRoomEnabled && event.name.toLowerCase().includes(searchQuery)
        );
      })
      .map((event) => {
        const imageUrl =
          enabledRelatedRooms.find((room) => room.title === event.room)
            ?.image_url ??
          relatedVenues.find((venue) => venue.id === event.venueId)?.host
            ?.icon ??
          DEFAULT_VENUE_LOGO;

        return {
          key: `event-${event.id ?? event.name}`,
          title: event.name,
          description: `Event - ${uppercaseFirstChar(
            formatUtcSecondsRelativeToNow(event.start_utc_seconds)
          )}`,
          image: imageUrl ?? DEFAULT_VENUE_LOGO,
          onClick: () => {
            setSelectedEvent(event);
            clearSearch();
          },
        };
      });
  }, [
    searchQuery,
    relatedEvents,
    enabledRelatedRoomsByTitle,
    enabledRelatedRooms,
    relatedVenues,
    clearSearch,
  ]);

  const foundItems = useMemo<NavSearchListItem[]>(
    () => [...foundRooms, ...foundEvents, ...foundUsers],
    [foundRooms, foundEvents, foundUsers]
  );

  const clearSearchIcon = (
    <img
      className="NavSearchBar__clear-search"
      src={navDropdownCloseIcon}
      alt="close button"
      onClick={clearSearch}
    />
  );

  const navDropdownClassnames = useMemo(
    () =>
      classNames("NavSearchBar__nav-dropdown", {
        "NavSearchBar__nav-dropdown--show": isTruthy(searchQuery),
      }),
    [searchQuery]
  );

  return (
    <div className="NavSearchBar">
      <div className={navDropdownClassnames}>
        <div className="NavSearchBar__nav-dropdown__title font-size--small">
          <strong className="NavSearchBar__search-results-number">
            {foundItems.length}
          </strong>
          search results
        </div>

        {isLoading || isEventsLoading ? (
          <Loading />
        ) : (
          <NavSearchList items={foundItems} />
        )}
      </div>

      <InputField
        value={searchInputValue}
        inputClassName="NavSearchBar__search-input"
        onChange={onSearchInputChange}
        placeholder="Search for people, rooms, events..."
        autoComplete="off"
        iconStart={faSearch}
        iconEnd={isTruthy(searchQuery) ? clearSearchIcon : undefined}
      />

      {/* @debt use only one RoomModal instance with state controlled with redux */}
      <RoomModal
        show={isDefined(selectedRoom)}
        room={selectedRoom}
        venue={selectedRoomVenue}
        onHide={hideRoomModal}
      />

      {/* @debt use only one EventModal instance with state controlled with redux */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          show={isDefined(selectedEvent)}
          onHide={hideEventModal}
        />
      )}
    </div>
  );
};
