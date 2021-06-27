import React, { useCallback } from "react";

import { SPARKLE_ICON } from "settings";

import { retainAttendance } from "store/actions/Attendance";

import { VenueEvent } from "types/venues";

import { getCurrentEvent } from "utils/event";

import { useDispatch } from "hooks/useDispatch";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import "./RoomModalOngoingEvent.scss";

interface RoomModalOngoingEventProps {
  roomEvents: VenueEvent[];
  onRoomEnter: () => void;
  roomUrl: string;
  joinButtonText?: string;
}

export const RoomModalOngoingEvent: React.FC<RoomModalOngoingEventProps> = ({
  roomEvents,
  onRoomEnter,
  roomUrl,
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
              src={SPARKLE_ICON}
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
          <div className="event-description">
            <RenderMarkdown text={eventToDisplay.description} />
          </div>
        </>
      )}
      <button
        onMouseOver={triggerAttendance}
        onMouseOut={clearAttendance}
        className="btn btn-primary room-entry-button"
        onClick={onRoomEnter}
      >
        <a href={roomUrl}>{joinButtonText ?? "Enter"}</a>
      </button>
    </div>
  );
};

export default RoomModalOngoingEvent;
