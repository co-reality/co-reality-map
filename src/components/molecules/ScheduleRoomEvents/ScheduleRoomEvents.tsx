import React from "react";

import { PersonalizedVenueEvent } from "types/venues";

import { ScheduleEvent } from "components/molecules/ScheduleEvent";

import "./ScheduleRoomEvents.scss";

export interface ScheduleRoomEventsProps {
  events: PersonalizedVenueEvent[];
  personalizedRoom?: boolean;
  scaleFactor: number;
  scheduleStartHour: number;
}

export const _ScheduleRoomEvents: React.FC<ScheduleRoomEventsProps> = ({
  events,
  personalizedRoom,
  scaleFactor,
  scheduleStartHour,
}) => {
  return (
    <div className="ScheduleRoomEvents">
      {events.map((event) => (
        <ScheduleEvent
          key={`event-${event.id}`}
          personalizedEvent={personalizedRoom}
          event={event}
          scaleFactor={scaleFactor}
          scheduleStartHour={scheduleStartHour}
        />
      ))}
    </div>
  );
};

export const ScheduleRoomEvents = React.memo(_ScheduleRoomEvents);
