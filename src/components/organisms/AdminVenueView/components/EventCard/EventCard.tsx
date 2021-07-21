import React from "react";
import { Link } from "react-router-dom";
import { sortBy } from "lodash";
import classNames from "classnames";

import { VenueEvent } from "types/venues";

import { WithVenueId, WithId } from "utils/id";
import { isEventLive } from "utils/event";
import { formatTimeLocalised } from "utils/time";

import "./EventCard.scss";

interface EventCardProps {
  events?: WithVenueId<WithId<VenueEvent>>[];
}

export const EventCard: React.FC<EventCardProps> = ({ events }) => {
  const [nextEvent, followingEvent] = sortBy(events ?? [], "start_utc_seconds");
  const live = nextEvent && isEventLive(nextEvent);

  const parentClasses = classNames({
    "EventCard EventCard--no-event": !nextEvent,
    "EventCard EventCard--live-event": nextEvent && live,
    "EventCard EventCard--future-event": nextEvent && !live,
  });

  const linkClasses = classNames({
    "EventCard__add EventCard__add--no-event": !nextEvent,
    "EventCard__add EventCard__add--future-event": nextEvent,
  });

  return (
    <div className={parentClasses}>
      {!nextEvent && (
        <span className="EventCard__empty">No planned events for today</span>
      )}

      {nextEvent && (
        <span className="EventCard__corner">
          {live ? "Current event" : "Next event"}
        </span>
      )}

      <Link className={linkClasses} to="#">
        Add event
      </Link>

      {nextEvent && (
        <div className="EventCard__time EventCard__time--first">
          {formatTimeLocalised(nextEvent.start_utc_seconds)}
        </div>
      )}

      {nextEvent && (
        <div className="EventCard__name EventCard__name--first">
          {nextEvent.name}
        </div>
      )}

      {followingEvent && (
        <div className="EventCard__time EventCard__time--subsequent">
          {formatTimeLocalised(followingEvent.start_utc_seconds)}
        </div>
      )}

      {followingEvent && (
        <div className="EventCard__name EventCard__name--subsequent">
          {followingEvent.name}
        </div>
      )}
    </div>
  );
};
