import React, { useCallback } from "react";

import { retainAttendance } from "store/actions/Attendance";

import { VenueEvent } from "types/venues";

import { getCurrentEvent } from "utils/event";

import { useDispatch } from "hooks/useDispatch";

import "./RoomModalOngoingEvent.scss";

interface RoomModalOngoingEventProps {
  roomTitle: string;
  roomEvents: VenueEvent[];
  onRoomEnter: () => void;
  joinButtonText?: string;
}

export const RoomModalOngoingEvent: React.FC<RoomModalOngoingEventProps> = ({
  roomTitle,
  roomEvents,
  onRoomEnter,
  joinButtonText,
}) => {
  const dispatch = useDispatch();
  const currentEvent = roomEvents && getCurrentEvent(roomEvents);
  const eventToDisplay =
    roomEvents &&
    roomEvents.length > 0 &&
    (currentEvent ? currentEvent : roomEvents[0]);

  const triggerAttendance = useCallback(() => {
    dispatch(retainAttendance(true));
  }, [dispatch]);

  const clearAttendance = useCallback(() => {
    dispatch(retainAttendance(false));
  }, [dispatch]);

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
            {currentEvent ? "What's on now" : "What's on next"}
          </div>
          <div className="artist-ongoing-container">
            <div className="event-title">{eventToDisplay.name}</div>
            <div>
              by <span className="artist-name">{eventToDisplay.host}</span>
            </div>
          </div>
          <div className="event-description">{eventToDisplay.description}</div>
        </>
      )}
      {!eventToDisplay && (
        <>
          <div className="event-description">
            <img
              src="/sparkle-icon.png"
              className="sparkle-icon"
              alt="sparkle-icon"
            />
            Please check the Live Schedule for events in this room.
          </div>
        </>
      )}
      <button
        onMouseOver={triggerAttendance}
        onMouseOut={clearAttendance}
        className="btn btn-primary room-entry-button"
        onClick={onRoomEnter}
      >
        {joinButtonText ?? "Enter"}
      </button>
    </div>
  );
};

export default RoomModalOngoingEvent;
