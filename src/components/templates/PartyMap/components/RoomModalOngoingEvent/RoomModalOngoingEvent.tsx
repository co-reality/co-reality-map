import React from "react";

import { RoomData } from "types/RoomData";
import { getCurrentEvent } from "utils/time";
import { useDispatch } from "hooks/useDispatch";
import { retainAttendance } from "store/actions/Attendance";

import "./RoomModalOngoingEvent.scss";

interface PropsType {
  room: RoomData;
  enterRoom: () => void;
  startUtcSeconds: number;
}

export const RoomModalOngoingEvent: React.FunctionComponent<PropsType> = ({
  room,
  enterRoom,
  startUtcSeconds,
}) => {
  const currentEvent = room.events && getCurrentEvent(room, startUtcSeconds);
  const eventToDisplay =
    room.events &&
    room.events.length > 0 &&
    (currentEvent ? currentEvent : room.events[0]);
  const dispatch = useDispatch();
  return (
    <div className="room-modal-ongoing-event-container">
      {eventToDisplay && (
        <>
          <div className="title-container">
            <img
              src="/sparkle-icon.png"
              className="sparkle-icon"
              alt="sparkle-icon"
            />
            {`What's on now`}
          </div>
          <div className="artist-ongoing-container">
            <div className="event-title">{eventToDisplay.name}</div>
            <div>
              by <span className="artist-name">{eventToDisplay.host}</span>
            </div>
          </div>
          <div className="event-description">{eventToDisplay.text}</div>
          <a
            onMouseOver={() => dispatch(retainAttendance(true))}
            onMouseOut={() => dispatch(retainAttendance(false))}
            className="btn btn-primary room-entry-button"
            onClick={enterRoom}
            id={`enter-room-in-ongoing-event-card-${room.title}`}
            href={room.external_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {room.button_text || "Join the room"}
          </a>
        </>
      )}
    </div>
  );
};
