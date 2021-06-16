import React, { useMemo } from "react";

import { PersonalizedVenueEvent } from "types/venues";
import { checkOverlap } from "utils/event";

import { ScheduleEvent } from "components/molecules/ScheduleEvent";

import "./ScheduleRoomEvents.scss";

export interface ScheduleRoomEventsProps {
  events: PersonalizedVenueEvent[];
  scheduleStartHour: number;
  personalizedRoom?: boolean;
}

export const _ScheduleRoomEvents: React.FC<ScheduleRoomEventsProps> = ({
  events,
  scheduleStartHour,
  personalizedRoom,
}) => {
  const { overlapEvents, totalOverlaps, sortedEvents } = useMemo(
    () => checkOverlap(events),
    [events]
  );

  return (
    <div className="ScheduleRoomEvents">
      {sortedEvents.map((event, index) => (
        <ScheduleEvent
          key={`event-${event.id}`}
          personalizedEvent={personalizedRoom}
          event={event}
          scheduleStartHour={scheduleStartHour}
          overlapEvents={overlapEvents[index]}
          totalOverlaps={totalOverlaps[index]}
        />
      ))}
    </div>
  );
};

export const ScheduleRoomEvents = React.memo(_ScheduleRoomEvents);
