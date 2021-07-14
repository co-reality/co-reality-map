import {
  addMinutes,
  areIntervalsOverlapping,
  differenceInMinutes,
  fromUnixTime,
  isAfter,
  isFuture,
  isWithinInterval,
  parseISO,
  getUnixTime,
} from "date-fns";

import { VenueEvent } from "types/venues";

import {
  formatUtcSecondsRelativeToNow,
  getCurrentTimeInUTCSeconds,
  getDayInterval,
} from "./time";

import { getCSVRows } from "./csv";
import { csvHeaders } from "./csvHeaders";

export const getCurrentEvent = (roomEvents: VenueEvent[]) =>
  roomEvents.find(isEventLive);

export const isEventLive = (event: VenueEvent) =>
  isWithinInterval(Date.now(), getEventInterval(event));

export const isEventFuture = (event: VenueEvent) =>
  isFuture(fromUnixTime(event.start_utc_seconds));

export const isEventLiveOrFuture = (event: VenueEvent) =>
  isEventLive(event) || isEventFuture(event);

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

export const eventsByStartUtcSecondsSorter = (a: VenueEvent, b: VenueEvent) =>
  a.start_utc_seconds - b.start_utc_seconds;

type RawEventsOptions = {
  [key: string]: string;
};

export const eventsFromCSVFile = async (filePath: string) => {
  const rawCSVRows = await getCSVRows(filePath);
  if (rawCSVRows) {
    return rawCSVRows.map((rawEvent: RawEventsOptions) => {
      const event: VenueEvent = {
        name: rawEvent[csvHeaders.eventName],
        duration_minutes: getDurationMinutes(
          rawEvent[csvHeaders.startDate],
          rawEvent[csvHeaders.endDate]
        ),
        start_utc_seconds: getUTCStartTime(rawEvent[csvHeaders.startDate]),
        description: rawEvent[csvHeaders.description],
        price: 0,
        collective_price: 0,
        host: rawEvent[csvHeaders.host],
      };

      if (rawEvent[csvHeaders.room] !== "-1") {
        event.room = rawEvent[csvHeaders.room];
      }
      return { event, venueId: rawEvent[csvHeaders.venueId] };
    });
  }
};

export const getDurationMinutes = (start: string, end: string) => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return differenceInMinutes(endDate, startDate);
};

export const getUTCStartTime = (start: string) => {
  const startDate = parseISO(start);
  return getUnixTime(startDate);
};
