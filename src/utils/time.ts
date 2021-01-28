import { format } from "date-fns";

import { VenueEvent } from "types/venues";

export const ONE_SECOND_IN_MILLISECONDS = 1000;
export const ONE_MINUTE_IN_SECONDS = 60;
export const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;
export const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;

export const FIVE_MINUTES_MS =
  5 * ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MILLISECONDS;
export const ONE_HOUR_IN_MILLISECONDS =
  ONE_SECOND_IN_MILLISECONDS * ONE_HOUR_IN_SECONDS;

export const SECONDS_TIMESTAMP_MAX_VALUE = 9999999999;

const formatMeasurementInString = (value: number, measureUnit: string) => {
  const baseFormatted = `${value} ${measureUnit}`;

  if (value === 0) return "";
  if (value === 1) return baseFormatted;
  if (value > 1) return `${baseFormatted}s`;
};

// @debt quality test this
export const getTimeBeforeParty = (startUtcSeconds?: number) => {
  if (startUtcSeconds === undefined) return "???";

  const secondsBeforeParty =
    startUtcSeconds - Date.now() / ONE_SECOND_IN_MILLISECONDS;

  if (secondsBeforeParty < 0) {
    return 0;
  }

  const numberOfCompleteDaysBeforeParty = Math.floor(
    secondsBeforeParty / ONE_DAY_IN_SECONDS
  );

  const numberOfCompleteHours = Math.floor(
    (secondsBeforeParty % ONE_DAY_IN_SECONDS) / ONE_HOUR_IN_SECONDS
  );

  const numberOfMinutes = Math.floor(
    (secondsBeforeParty % ONE_HOUR_IN_SECONDS) / ONE_MINUTE_IN_SECONDS
  );

  const numberOfDaysInString = formatMeasurementInString(
    numberOfCompleteDaysBeforeParty,
    "day"
  );
  const numberOfHoursInString = formatMeasurementInString(
    numberOfCompleteHours,
    "hour"
  );
  const numberOfMinutesInString = formatMeasurementInString(
    numberOfMinutes,
    "minute"
  );

  return `${numberOfDaysInString} ${numberOfHoursInString} ${numberOfMinutesInString}`;
};

export const canUserJoinTheEvent = (event: VenueEvent) =>
  event.start_utc_seconds - Date.now() / ONE_SECOND_IN_MILLISECONDS >
  ONE_HOUR_IN_SECONDS;

export function formatMinute(
  minute: number | null | undefined,
  startUtcSeconds: number
) {
  if (minute === null || minute === undefined) {
    return "(unknown)";
  }
  const utcSeconds = startUtcSeconds + minute * ONE_MINUTE_IN_SECONDS;
  return formatUtcSeconds(utcSeconds);
}

export function formatDate(utcSeconds: number) {
  return format(new Date(utcSeconds * ONE_SECOND_IN_MILLISECONDS), "MMM do");
}

export function oneHourAfterTimestamp(timestamp: number) {
  return timestamp + ONE_HOUR_IN_SECONDS;
}

export function formatUtcSeconds(utcSeconds?: number | null) {
  return utcSeconds
    ? format(new Date(utcSeconds * ONE_SECOND_IN_MILLISECONDS), "p")
    : "(unknown)";
}

export function getHoursAgoInSeconds(hours: number) {
  const nowInSec = Date.now() / ONE_SECOND_IN_MILLISECONDS;
  return nowInSec - hours * ONE_HOUR_IN_SECONDS;
}

export const getHoursAgoInMilliseconds = (hours: number) =>
  Date.now() - hours * ONE_HOUR_IN_MILLISECONDS;

export const getCurrentTimeInUnixEpochSeconds = () =>
  Date.now() / ONE_SECOND_IN_MILLISECONDS;

export const getCurrentTimeInMilliseconds = () => Date.now();

export function getDaysAgoInSeconds(days: number) {
  return getHoursAgoInSeconds(days * 24);
}

export const formatHourAndMinute = (utcSeconds: number) => {
  const date = new Date(utcSeconds * ONE_SECOND_IN_MILLISECONDS);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return hh + ":" + mm;
};

export const daysFromEndOfEvent = (
  utcSeconds: number,
  durationMinutes: number
) => {
  const dateNow = new Date();
  const dateOfFinish = new Date(
    (utcSeconds + durationMinutes * 60) * ONE_SECOND_IN_MILLISECONDS
  );
  const differenceInTime = dateOfFinish.getTime() - dateNow.getTime();
  const differenceInDays =
    differenceInTime / (ONE_SECOND_IN_MILLISECONDS * 3600 * 24);
  return Math.round(differenceInDays);
};

export const daysFromStartOfEvent = (utcSeconds: number) => {
  const dateNow = new Date();
  const dateOfStart = new Date(utcSeconds * ONE_SECOND_IN_MILLISECONDS);
  const differenceInTime = dateNow.getTime() - dateOfStart.getTime();
  const differenceInDays =
    differenceInTime / (ONE_SECOND_IN_MILLISECONDS * 3600 * 24);
  return Math.round(differenceInDays);
};

export const dateEventTimeFormat = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return hh + ":" + mm;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
//   The static Date.now() method returns the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
export const getCurrentTimeInUTCSeconds = () =>
  Date.now() / ONE_SECOND_IN_MILLISECONDS;

export const roundToNearestHour = (seconds: number) => {
  const oneHour = 60 * 60;
  return Math.floor(seconds / oneHour) * oneHour;
};

export function formatDateToWeekday(utcSeconds: number) {
  return format(new Date(utcSeconds * ONE_SECOND_IN_MILLISECONDS), "E");
}

export const normalizeTimestampToMilliseconds = (timestamp: number) => {
  const isTimestampInMilliSeconds = timestamp > SECONDS_TIMESTAMP_MAX_VALUE;

  return isTimestampInMilliSeconds
    ? timestamp
    : timestamp * ONE_SECOND_IN_MILLISECONDS;
};
