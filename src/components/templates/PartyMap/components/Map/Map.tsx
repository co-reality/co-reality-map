import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseReducer } from "react-redux-firebase";

import {
  DEFAULT_MAP_BACKGROUND,
  MAXIMUM_COLUMNS,
  MINIMUM_COLUMNS,
} from "settings";

import { User, UserExperienceData } from "types/User";
import { Room } from "types/rooms";
import { PartyMapVenue } from "types/venues";

import { makeUpdateUserGridLocation } from "api/profile";

import { hasElements } from "utils/types";
import { filterEnabledRooms, makeRoomHitFilter } from "utils/filter";
import { WithId } from "utils/id";
import { setLocationData } from "utils/userLocation";

import { useKeyboardControls } from "hooks/useKeyboardControls";
import { useRecentVenueUsers } from "hooks/users";

import { useRelatedVenues } from "hooks/useRelatedVenues";
import { useVenueEvents } from "hooks/events";
import { isEventLive } from "utils/event";

// @debt refactor these hooks into somewhere more sensible
import { useMapGrid } from "./hooks/useMapGrid";
import { usePartygoersbySeat } from "./hooks/usePartygoersBySeat";
import { usePartygoersOverlay } from "./hooks/usePartygoersOverlay";

import { MapRoom } from "./MapRoom";

import "./Map.scss";

export const DEFAULT_COLUMNS = 40;
export const DEFAULT_ROWS = 25;

interface MapProps {
  user: FirebaseReducer.AuthState;
  profileData?: UserExperienceData;
  venue: PartyMapVenue;
  partygoers: readonly WithId<User>[];
  selectRoom: (room: Room) => void;
  unselectRoom: () => void;
}

export const Map: React.FC<MapProps> = ({
  user,
  profileData = {},
  venue,
  partygoers,
  selectRoom,
  unselectRoom,
}) => {
  const venueId = venue.id;
  const venueName = venue.name;
  const userUid = user?.uid;
  const showGrid = venue.showGrid;

  const totalColumns = Math.max(
    MINIMUM_COLUMNS,
    Math.min(MAXIMUM_COLUMNS, venue.columns ?? DEFAULT_COLUMNS)
  );
  const [totalRows, setTotalRows] = useState<number>(0);

  const { recentVenueUsers } = useRecentVenueUsers();
  const columnsArray = useMemo(
    () => Array.from(Array<JSX.Element>(totalColumns)),
    [totalColumns]
  );
  const rowsArray = useMemo(() => Array.from(Array(totalRows)), [totalRows]);

  useEffect(() => {
    const img = new Image();
    img.src = !!venue.mapBackgroundImageUrl
      ? venue.mapBackgroundImageUrl
      : DEFAULT_MAP_BACKGROUND;
    img.onload = () => {
      const imgRatio = img.width ? img.width / img.height : 1;

      const calcRows = venue.columns
        ? Math.round(parseInt(venue.columns.toString()) / imgRatio)
        : DEFAULT_ROWS;

      setTotalRows(calcRows);
    };
  }, [venue.columns, venue.mapBackgroundImageUrl]);

  const takeSeat = useCallback(
    (row: number | null, column: number | null) => {
      if (!userUid) return;

      makeUpdateUserGridLocation({
        venueId,
        userUid,
      })(row, column);

      setLocationData({ userId: userUid, locationName: venueName });
    },
    [userUid, venueId, venueName]
  );

  const currentPosition = profileData?.[venue.id];

  const checkForRoomHit = useCallback(
    (row: number, column: number) => {
      if (!venue) return;

      const roomHitFilter = makeRoomHitFilter({
        row,
        column,
        totalRows,
        totalColumns,
      });

      // Only select the first room if we hit multiple (eg. overlapping)
      const roomHit = venue.rooms?.find(roomHitFilter);
      if (roomHit) {
        selectRoom(roomHit);
      }
    },
    [selectRoom, totalColumns, totalRows, venue]
  );

  const roomsHit = useMemo(() => {
    if (
      !venue ||
      !venue.rooms ||
      !currentPosition?.row ||
      !currentPosition?.column
    )
      return [];

    const { row, column } = currentPosition;

    const roomHitFilter = makeRoomHitFilter({
      row,
      column,
      totalRows,
      totalColumns,
    });

    return venue.rooms.filter(roomHitFilter);
  }, [venue, currentPosition, totalRows, totalColumns]);

  useEffect(() => {
    if (hasElements(roomsHit)) {
      // Only select the first room if we hit multiple (eg. overlapping)
      roomsHit.slice(0, 1).forEach((room) => {
        selectRoom(room);
      });
    } else {
      unselectRoom();
    }
  }, [roomsHit, selectRoom, unselectRoom]);

  // @debt It seems seatedPartygoer is only passed in here so we don't try and take an already occupied seat
  //  Instead of threading this all the way down into useMapGrid -> MapCell, can we just close over partygoersBySeat here,
  //  and/or handle it in a better way?
  const onSeatClick = useCallback(
    (row: number, column: number, seatedPartygoer?: WithId<User>) => {
      if (!seatedPartygoer) {
        takeSeat(row, column);
      } else {
        checkForRoomHit(row, column);
      }
    },
    [checkForRoomHit, takeSeat]
  );

  const { partygoersBySeat, isSeatTaken } = usePartygoersbySeat({
    venueId,
    partygoers,
  });

  useKeyboardControls({
    venueId,
    totalRows,
    totalColumns,
    isSeatTaken,
    takeSeat,
  });

  const mapGrid = useMapGrid({
    showGrid,
    userUid,
    columnsArray,
    rowsArray,
    partygoersBySeat,
    onSeatClick,
  });

  // TODO: this probably doesn't even need to be a hook.. it's more of a component if anything. We can clean this up later
  const partygoersOverlay = usePartygoersOverlay({
    showGrid,
    userUid,
    venueId,
    withMiniAvatars: venue.miniAvatars,
    rows: totalRows,
    columns: totalColumns,
    partygoers: recentVenueUsers,
  });

  const [liveRooms, setLiveRooms] = useState<Array<string | undefined>>();

  const { relatedVenues, relatedVenueIds } = useRelatedVenues({
    currentVenueId: venue.id,
  });
  const { events: relatedVenueEvents } = useVenueEvents({
    venueIds: relatedVenueIds,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const liveEvents = relatedVenueEvents.filter((event) =>
        isEventLive(event)
      );
      const liveLocations = liveEvents.map(
        (event) =>
          relatedVenues.find((venue) => venue.id === event.venueId)?.name
      );
      setLiveRooms(liveLocations);
    }, 1000);
    return () => clearInterval(interval);
  }, [relatedVenueEvents, relatedVenues]);

  const roomOverlay = useMemo(
    () =>
      venue?.rooms
        ?.filter(filterEnabledRooms)
        .map((room) => (
          <MapRoom
            key={room.title}
            venue={venue}
            room={room}
            isLive={liveRooms?.includes(room.title)}
            selectRoom={() => selectRoom(room)}
          />
        )),
    [selectRoom, venue, liveRooms]
  );

  const gridContainerStyles = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${totalColumns}, calc(100% / ${totalColumns}))`,
      gridTemplateRows: `repeat(${totalRows}, 1fr)`,
    }),
    [totalColumns, totalRows]
  );

  if (!user || !venue) {
    return <>Loading map...</>;
  }

  return (
    <div className="party-map-map-component">
      <div className="party-map-map-content">
        <img
          width="100%"
          className="party-map-background"
          src={venue.mapBackgroundImageUrl ?? DEFAULT_MAP_BACKGROUND}
          alt=""
        />

        <div className="party-map-grid-container" style={gridContainerStyles}>
          {mapGrid}
          {partygoersOverlay}
          {roomOverlay}
        </div>
      </div>
    </div>
  );
};
