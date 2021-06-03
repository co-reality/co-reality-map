import React, { useCallback, useMemo } from "react";
import classNames from "classnames";

import { retainAttendance } from "store/actions/Attendance";

import { Room, RoomTypes } from "types/rooms";
import { PartyMapVenue, RoomVisibility } from "types/venues";

import { useCustomSound } from "hooks/sounds";
import { useDispatch } from "hooks/useDispatch";
import { useRoom } from "hooks/useRoom";

import RoomAttendance from "../RoomAttendance";

import "./MapRoom.scss";

const noop = () => {};

export interface MapRoomProps {
  venue: PartyMapVenue;
  room: Room;
  isLive?: Boolean;
  selectRoom: () => void;
}

export const MapRoom: React.FC<MapRoomProps> = ({
  venue,
  room,
  isLive,
  selectRoom,
}) => {
  const { recentRoomUsers } = useRoom({ room, venueName: venue.name });
  const hasRecentRoomUsers = recentRoomUsers.length > 0;

  const isUnclickable = room.type === RoomTypes.unclickable;

  const dispatch = useDispatch();

  const handleRoomHovered = useCallback(() => {
    dispatch(retainAttendance(true));
  }, [dispatch]);

  const handleRoomUnhovered = useCallback(() => {
    dispatch(retainAttendance(false));
  }, [dispatch]);

  const containerClasses = classNames("maproom", {
    "maproom--unclickable": isUnclickable,
    "maproom--always-show-label":
      !isUnclickable &&
      (venue.roomVisibility === RoomVisibility.nameCount ||
        (venue.roomVisibility === RoomVisibility.count && hasRecentRoomUsers)),
  });

  const titleClasses = classNames("maproom__title", {
    "maproom__title--count":
      !isUnclickable && venue.roomVisibility === RoomVisibility.count,
  });

  const imageClasses = classNames("maproom__image", {
    "maproom__title islive": isLive,
  });

  const roomInlineStyles = useMemo(
    () => ({
      left: `${room.x_percent}%`,
      top: `${room.y_percent}%`,
      width: `${room.width_percent}%`,
      height: `${room.height_percent}%`,
      zIndex: room.zIndex,
    }),
    [
      room.height_percent,
      room.width_percent,
      room.x_percent,
      room.y_percent,
      room.zIndex,
    ]
  );

  const [play] = useCustomSound(room.enterSound, { interrupt: true });
  const selectRoomWithSound = useCallback(() => {
    play();
    selectRoom();
  }, [play, selectRoom]);

  return (
    <div
      className={containerClasses}
      style={roomInlineStyles}
      onClick={isUnclickable ? noop : selectRoomWithSound}
      onMouseEnter={isUnclickable ? noop : handleRoomHovered}
      onMouseLeave={isUnclickable ? noop : handleRoomUnhovered}
    >
      <img className={imageClasses} src={room.image_url} alt={room.title} />

      {!isUnclickable && (
        <div className="maproom__label">
          <span className={titleClasses}>{room.title}</span>
          <RoomAttendance venue={venue} room={room} />
        </div>
      )}
    </div>
  );
};
