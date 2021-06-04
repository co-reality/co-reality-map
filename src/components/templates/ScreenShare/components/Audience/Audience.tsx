import React, { useCallback, useMemo } from "react";
import classNames from "classnames";

import { BaseVenue } from "types/venues";

import { makeUpdateUserGridLocation } from "api/profile";

import { WithId } from "utils/id";
import { isDefined } from "utils/types";
import { setLocationData } from "utils/userLocation";

import { useUser } from "hooks/useUser";
import { useRecentVenueUsers } from "hooks/users";
import { useKeyboardControls } from "hooks/useKeyboardControls";

import { usePartygoersbySeat } from "components/templates/PartyMap/components/Map/hooks/usePartygoersBySeat";
import { useMapGrid } from "components/templates/PartyMap/components/Map/hooks/useMapGrid";
import { usePartygoersOverlay } from "components/templates/PartyMap/components/Map/hooks/usePartygoersOverlay";

import "./Audience.scss";

export interface AudienceProps {
  venue: WithId<BaseVenue>;
}
const TOTAL_COLUMNS = 30;
const TOTAL_ROWS = 8;

const Audience: React.FC<AudienceProps> = ({ venue }) => {
  const { name, id: venueId, showGrid } = venue;
  const { userId, profile } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers();

  const isHidden = isDefined(profile?.data?.[venueId]);

  const takeSeat = useCallback(
    (row: number | null, column: number | null) => {
      if (!userId) return;

      makeUpdateUserGridLocation({
        venueId,
        userUid: userId,
      })(row, column);

      setLocationData({ userId: userId, locationName: name });
    },
    [userId, venueId, name]
  );

  // @debt It seems seatedPartygoer is only passed in here so we don't try and take an already occupied seat
  //  Instead of threading this all the way down into useMapGrid -> MapCell, can we just close over partygoersBySeat here,
  //  and/or handle it in a better way?
  const onSeatClick = useCallback(
    (row: number, column: number) => takeSeat(row, column),
    [takeSeat]
  );

  const columnsArray = useMemo(
    () => Array.from(Array<JSX.Element>(TOTAL_COLUMNS)),
    []
  );
  const rowsArray = useMemo(() => Array.from(Array(TOTAL_ROWS)), []);

  const gridContainerStyles = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${TOTAL_COLUMNS}, calc(100% / ${TOTAL_COLUMNS}))`,
      gridTemplateRows: `repeat(${TOTAL_ROWS}, 1fr)`,
    }),
    []
  );
  const { partygoersBySeat, isSeatTaken } = usePartygoersbySeat({
    venueId,
    partygoers: recentVenueUsers,
  });

  useKeyboardControls({
    venueId,
    totalRows: TOTAL_ROWS,
    totalColumns: TOTAL_COLUMNS,
    isSeatTaken,
    takeSeat,
  });

  const mapGrid = useMapGrid({
    showGrid,
    userUid: userId,
    columnsArray,
    rowsArray,
    partygoersBySeat,
    onSeatClick,
  });

  // TODO: this probably doesn't even need to be a hook.. it's more of a component if anything. We can clean this up later
  const partygoersOverlay = usePartygoersOverlay({
    showGrid,
    userUid: userId,
    venueId,
    withMiniAvatars: venue.miniAvatars,
    rows: TOTAL_ROWS,
    columns: TOTAL_COLUMNS,
    partygoers: recentVenueUsers,
  });

  const titleStyles = classNames("Screenshare__audience-title", {
    "Screenshare__audience-title--hidden": isHidden,
  });

  return (
    <div className="Screenshare__audience">
      <div className={titleStyles}>Please take a seat!</div>
      <div
        className="Screenshare__audience-container"
        style={gridContainerStyles}
      >
        {mapGrid}
        {partygoersOverlay}
      </div>
    </div>
  );
};

export default Audience;