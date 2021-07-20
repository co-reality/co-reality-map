import React, { useState } from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";

import { WithId } from "utils/id";
import { formatTimeLocalised } from "utils/time";
import { eventStartTime, eventEndTime } from "utils/event";

import { VenueEvent } from "types/venues";

export type TimingEventProps = {
  event: WithId<VenueEvent>;
  setShowCreateEventModal: () => void;
  setEditedEvent: (event: WithId<VenueEvent>) => void;
};

export const TimingEvent: React.FC<TimingEventProps> = ({
  event,
  setShowCreateEventModal,
  setEditedEvent,
}) => {
  const [display, setDisplay] = useState(false);

  const showButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplay(true);
  };
  const hideButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplay(false);
  };

  return (
    <div
      key={event.id}
      className="TimingEvent"
      onMouseEnter={showButton}
      onMouseLeave={hideButton}
    >
      <div className="TimingEvent__time">
        <p>{format(eventStartTime(event), "do MMM")}</p>
        <p className="TimingEvent__time-start">
          {formatTimeLocalised(eventStartTime(event))}
        </p>
        <p>{formatTimeLocalised(eventEndTime(event))}</p>
      </div>
      <div className="TimingEvent__details">
        <p>
          <span className="TimingEvent__details-name">{event.name}</span> by{" "}
          <span className="TimingEvent__details-host">{event.host}</span>
        </p>
        <p className="TimingEvent__details-description">{event.description}</p>
        <p className="TimingEvent__details-room">
          in <span className="event-details-room-name">{event.room}</span>
        </p>
      </div>

      {display && (
        <button
          className="event__edit-button"
          onClick={() => {
            setShowCreateEventModal();
            setEditedEvent(event);
          }}
        >
          <FontAwesomeIcon
            icon={faPen}
            className="edit-button__icon"
            size="lg"
          />
        </button>
      )}
    </div>
  );
};
