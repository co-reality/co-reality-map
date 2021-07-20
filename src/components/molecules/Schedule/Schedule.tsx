import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import {
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  getUnixTime,
  setHours,
} from "date-fns";
import { useCss } from "react-use";

import {
  SCHEDULE_CURRENT_TIMELINE_MS,
  SCHEDULE_HOUR_COLUMN_WIDTH_PX,
  SCHEDULE_MAX_START_HOUR,
} from "settings";

import { PersonalizedVenueEvent, LocationEvents } from "types/venues";

import { eventStartTime } from "utils/event";
import { formatMeasurement } from "utils/formatMeasurement";

import { useInterval } from "hooks/useInterval";

import { Loading } from "components/molecules/Loading";
import { ScheduleRoomEvents } from "components/molecules/ScheduleRoomEvents";

import { calcStartPosition } from "./utils";

import "./Schedule.scss";
import { sortScheduleRoomsAlphabetically } from "utils/schedule";

export interface ScheduleProps {
  locatedEvents: LocationEvents[];
  personalEvents: PersonalizedVenueEvent[];
  scheduleDate: Date;
  scheduleScaleFactor: number;
  isToday: boolean;
  isLoading: boolean;
}

export const Schedule: React.FC<ScheduleProps> = ({
  locatedEvents,
  personalEvents,
  scheduleDate,
  scheduleScaleFactor,
  isToday,
  isLoading,
}) => {
  const hasEvents = locatedEvents.length > 0;

  const scheduleStartHour = useMemo(
    () =>
      Math.min(
        ...locatedEvents.map(({ events }) =>
          events.reduce(
            (acc, event) => Math.min(acc, getHours(eventStartTime(event))),
            SCHEDULE_MAX_START_HOUR
          )
        ),
        SCHEDULE_MAX_START_HOUR
      ),
    [locatedEvents]
  );

  const scheduleStartDateTime = useMemo(
    () => setHours(scheduleDate, scheduleStartHour),
    [scheduleStartHour, scheduleDate]
  );

  const sortedEvents = useMemo(
    () => sortScheduleRoomsAlphabetically(locatedEvents),
    [locatedEvents]
  );

  // pairs (venueId, roomTitle) are unique because they are grouped earlier (see NavBarSchedule#schedule)
  const roomCells = useMemo(
    () =>
      sortedEvents.map(({ location, events }) => (
        <div
          key={`RoomCell-${location.venueId}-${location.roomTitle}`}
          className="Schedule__room"
        >
          <p className="Schedule__room-title">
            {location.roomTitle ?? location.venueName ?? location.venueId}
          </p>
          <span className="Schedule__events-count">
            {formatMeasurement(events.length, "event")}
          </span>
        </div>
      )),
    [sortedEvents]
  );

  const hoursRow = useMemo(
    () =>
      eachHourOfInterval({
        start: scheduleStartDateTime,
        end: endOfDay(scheduleStartDateTime),
      }).map((scheduleHour) => (
        <span key={scheduleHour.toISOString()} className="Schedule__hour">
          {format(scheduleHour, "h a")}
        </span>
      )),
    [scheduleStartDateTime]
  );

  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  const calcCurrentTimePosition = useCallback(
    () =>
      setCurrentTimePosition(
        calcStartPosition(getUnixTime(Date.now()), scheduleStartHour)
      ),
    [scheduleStartHour]
  );

  useEffect(() => calcCurrentTimePosition(), [calcCurrentTimePosition]);

  useInterval(() => {
    calcCurrentTimePosition();
  }, SCHEDULE_CURRENT_TIMELINE_MS);

  const containerVars = useCss({
    "--room-count": locatedEvents.length + 1, // +1 is needed for the 1st personalized line of the schedule
    "--current-time--position": currentTimePosition,
    "--hours-count": hoursRow.length,
    "--hour-width": `${SCHEDULE_HOUR_COLUMN_WIDTH_PX * scheduleScaleFactor}px`,
  });

  const containerClasses = classNames("Schedule", containerVars);

  // pairs (venueId, roomTitle) are unique because they are grouped earlier (see NavBarSchedule#schedule)
  const rowsWithTheEvents = useMemo(
    () =>
      locatedEvents.map(({ location, events }) => (
        <ScheduleRoomEvents
          key={`ScheduleRoomEvents-${location.venueId}-${location.roomTitle}`}
          events={events}
          scaleFactor={scheduleScaleFactor}
          scheduleStartHour={scheduleStartHour}
        />
      )),
    [locatedEvents, scheduleStartHour, scheduleScaleFactor]
  );

  if (isLoading) {
    return (
      <Loading
        containerClassName="Schedule__loading"
        label={"Events are loading"}
      />
    );
  }

  if (!hasEvents) {
    return (
      <div className={containerClasses}>
        <div className="Schedule__no-events">No events scheduled</div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="Schedule__rooms">
        <div className="Schedule__room">
          <p className="Schedule__room-title">My Daily Schedule</p>
          <span className="Schedule__events-count">
            {personalEvents.length} events
          </span>
        </div>

        {roomCells}
      </div>

      <div className="Schedule__schedule">
        <div className="Schedule__timeline">{hoursRow}</div>

        {isToday && <div className="Schedule__current-time-line" />}

        <div className="Schedule__user-schedule">
          <ScheduleRoomEvents
            personalizedRoom
            events={personalEvents}
            scheduleStartHour={scheduleStartHour}
            scaleFactor={scheduleScaleFactor}
          />
        </div>

        {rowsWithTheEvents}
      </div>
    </div>
  );
};
