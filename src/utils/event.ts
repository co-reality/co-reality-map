import {
  addMinutes,
  areIntervalsOverlapping,
  differenceInMinutes,
  fromUnixTime,
  isAfter,
  isWithinInterval,
} from "date-fns";

import { VenueEvent, PersonalizedVenueEvent } from "types/venues";

import {
  formatUtcSecondsRelativeToNow,
  getCurrentTimeInUTCSeconds,
  getDayInterval,
} from "./time";

export const getCurrentEvent = (roomEvents: VenueEvent[]) => {
  const currentTimeInUTCSeconds = getCurrentTimeInUTCSeconds();

  return roomEvents.find(
    (event) =>
      event.start_utc_seconds < currentTimeInUTCSeconds &&
      event.start_utc_seconds + event.duration_minutes > currentTimeInUTCSeconds
  );
};

export const isEventLive = (event: VenueEvent) =>
  isWithinInterval(Date.now(), getEventInterval(event));

export const isEventLiveOrFuture = (event: VenueEvent) => {
  const currentTimeInUTCSeconds = getCurrentTimeInUTCSeconds();

  return (
    isEventLive(event) || event.start_utc_seconds > currentTimeInUTCSeconds
  );
};

export const eventHappeningNow = (
  roomName: string,
  venueEvents: VenueEvent[]
) => {
  const currentTimeInUTCSeconds = getCurrentTimeInUTCSeconds();

  return venueEvents.find(
    (event) =>
      event.room === roomName &&
      event.start_utc_seconds < currentTimeInUTCSeconds &&
      event.start_utc_seconds + event.duration_minutes > currentTimeInUTCSeconds
  );
};

export const hasEventFinished = (event: VenueEvent) =>
  isAfter(Date.now(), eventEndTime(event));

export const eventStartTime = (event: VenueEvent) =>
  fromUnixTime(event.start_utc_seconds);

export const eventEndTime = (event: VenueEvent) =>
  addMinutes(eventStartTime(event), event.duration_minutes);

export const isEventStartingSoon = (event: VenueEvent) =>
  differenceInMinutes(eventStartTime(event), Date.now()) <= 60;

export const getEventInterval = (event: VenueEvent) => ({
  start: eventStartTime(event),
  end: eventEndTime(event),
});

export const isEventWithinDate = (checkDate: Date | number) => (
  event: VenueEvent
) =>
  areIntervalsOverlapping(getDayInterval(checkDate), getEventInterval(event));

export const isEventWithinDateAndNotFinished = (checkDate: Date | number) => (
  event: VenueEvent
) => isEventWithinDate(checkDate)(event) && !hasEventFinished(event);

export const getEventStatus = (event: VenueEvent) => {
  if (isEventLive(event)) return `Happening now`;

  if (hasEventFinished(event)) {
    return `Ended`;
  } else {
    return `Starts ${formatUtcSecondsRelativeToNow(event.start_utc_seconds)}`;
  }
};

export const checkOverlap = (events: PersonalizedVenueEvent[]) => {
  let overlapEvents: number[] = new Array(events.length).fill(0);
  let totalOverlaps: number[] = new Array(events.length).fill(1);

  if (events.length === 1)
    return { overlapEvents, totalOverlaps, sortedEvents: events };

  const sortedEvents = events.sort(
    (a, b) => a.start_utc_seconds - b.start_utc_seconds
  );

  let count = 0;

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEndTime =
      sortedEvents[i].start_utc_seconds + sortedEvents[i].duration_minutes * 60;
    const nextStartTime = sortedEvents[i + 1].start_utc_seconds;

    if (currentEndTime - nextStartTime > 60) {
      count += 1;
      overlapEvents[i + 1] = count;
      for (let j = 0; j < count + 1; j++) {
        totalOverlaps[i + 1 - j] = count + 1;
      }
    } else {
      count = 0;
    }
  }

  return { overlapEvents, totalOverlaps, sortedEvents };
};
