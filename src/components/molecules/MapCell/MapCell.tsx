import React, { useCallback } from "react";

import { User } from "types/User";
import { WithId } from "utils/id";

interface MapCellProps {
  row: number;
  column: number;

  // @debt We seem to only use this to pass in to onSeatClick. Is it even needed in that function?
  //  We don't really handle user avatars in this layer anymore, so it seems out of place here..
  seatedPartygoer?: WithId<User>;

  // @debt we seem to only use this to apply the 'avatar' class, but I don't think we
  //  need those styles anymore as UserProfilePicture wraps it all up anyway
  /** @default false **/
  hasSeatedPartygoer?: boolean;

  // @debt we seem to only use this to apply the 'seat' class instead of the `not-seat` class,
  //  which seems to remove the translucent 'grid bubble' (but seemingly not much else). I don't
  //  think we need this here anymore.
  /** @default false **/
  seatedPartygoerIsMe?: boolean;

  onSeatClick?: (
    row: number,
    column: number,
    seatedPartygoer?: WithId<User>
  ) => void;
}

export const _MapCell: React.FC<MapCellProps> = ({
  row,
  column,
  seatedPartygoer,

  hasSeatedPartygoer = false,
  seatedPartygoerIsMe = false,
  onSeatClick,
}) => {
  const handleSeatClick = useCallback(
    () => onSeatClick && onSeatClick(row, column, seatedPartygoer),
    [column, onSeatClick, row, seatedPartygoer]
  );

  return (
    <div className="seat-row">
      <div className="seat-container" onClick={handleSeatClick}>
        <div className={hasSeatedPartygoer ? "seat" : "not-seat"}>
          {hasSeatedPartygoer && (
            <div className={seatedPartygoerIsMe ? "user avatar" : "user"} />
          )}
        </div>
      </div>
    </div>
  );
};

export const MapCell = React.memo(_MapCell);
