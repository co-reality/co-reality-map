import React from "react";

import { User } from "types/User";

import { WithId } from "utils/id";

import { GetUserByPostion } from "hooks/useGetUserByPosition";

import { MapCell } from "components/molecules/MapCell";

import "./MapRoom.scss";

export interface MapGridProps {
  userUid?: string;
  columnsArray: JSX.Element[];
  rowsArray: JSX.Element[];
  getUserBySeat: GetUserByPostion;
  onSeatClick: (
    row: number,
    column: number,
    seatedPartygoer?: WithId<User>
  ) => void;
}

// @debt getUserBySeat breaks memo because it comes from partygoers, which comes from recentVenueUsers which comes from useRecentVenueUsers
//   We need to refactor this so that user location updates don't flow through here and cause unneeded re-renders.
export const _MapGrid: React.FC<MapGridProps> = ({
  userUid,
  columnsArray,
  rowsArray,
  getUserBySeat,
  onSeatClick,
}) => {
  // @debt can we refactor this to position MapCell directly, and do away with the nested loops altogether?
  return (
    <>
      {columnsArray.map((_, colIndex) => (
        <div className="seat-column" key={`column${colIndex}`}>
          {rowsArray.map((_, rowIndex) => {
            const column = colIndex + 1; // TODO: do these need to be here, can we zero index?
            const row = rowIndex + 1; // TODO: do these need to be here, can we zero index?

            const seatedPartygoer = getUserBySeat({ row, column });
            const hasSeatedPartygoer = seatedPartygoer !== undefined;

            // TODO: our types imply that this shouldn't be able to be null, but it was..
            const isMe = seatedPartygoer?.id === userUid;

            return (
              <MapCell
                key={`row${rowIndex}`}
                row={row}
                column={column}
                // @debt do we need these *partygoer* props here anymore? See debt notes in MapCell for more details
                seatedPartygoer={seatedPartygoer}
                hasSeatedPartygoer={hasSeatedPartygoer}
                seatedPartygoerIsMe={isMe}
                onSeatClick={onSeatClick}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

export const MapGrid = React.memo(_MapGrid);
