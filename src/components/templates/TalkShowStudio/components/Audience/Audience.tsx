import React, { useCallback, useMemo } from "react";
import classNames from "classnames";

import { FullTalkShowVenue } from "types/venues";

import { makeUpdateUserGridLocation } from "api/profile";

import { WithId } from "utils/id";
import { isDefined } from "utils/types";
import { setLocationData } from "utils/userLocation";

import { useRecentVenueUsers } from "hooks/users";
import { useKeyboardControls } from "hooks/useKeyboardControls";
import { useUser } from "hooks/useUser";
import { useStage } from "hooks/useStage";

import { usePartygoersbySeat } from "components/templates/PartyMap/components/Map/hooks/usePartygoersBySeat";
import { useMapGrid } from "components/templates/PartyMap/components/Map/hooks/useMapGrid";
import { usePartygoersOverlay } from "components/templates/PartyMap/components/Map/hooks/usePartygoersOverlay";

import "./Audience.scss";

export interface AudienceProps {
  venue: WithId<FullTalkShowVenue>;
}
const TOTAL_COLUMNS = 30;
const TOTAL_ROWS = 8;

const Audience: React.FC<AudienceProps> = ({ venue }) => {
  const { name, id: venueId } = venue;
  const { userId, profile } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers();
  const { peopleRequesting } = useStage({ venueId });

  const isHidden = isDefined(profile?.data?.[venueId]?.row);

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
    showGrid: true,
    userUid: userId,
    columnsArray,
    rowsArray,
    partygoersBySeat,
    onSeatClick,
  });

  const partygoersOverlay = usePartygoersOverlay({
    showGrid: true,
    userUid: userId,
    venueId,
    withMiniAvatars: venue.miniAvatars,
    rows: TOTAL_ROWS,
    columns: TOTAL_COLUMNS,
    partygoers: recentVenueUsers,
    peopleRequesting,
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
