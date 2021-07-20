import {
  differenceInSeconds,
  endOfDay,
  format,
  formatDuration,
  formatRelative,
  fromUnixTime,
  getTime,
  getUnixTime,
  intervalToDuration,
  isAfter,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  subDays,
  subHours,
} from "date-fns";

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_SECOND_IN_MILLISECONDS = 1000;

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_MINUTE_IN_SECONDS = 60;

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_HOUR_IN_MINUTES = 60;

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;

/**
 * @deprecated in favor of using date-fns functions
 */
export const FIVE_MINUTES_MS =
  5 * ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MILLISECONDS;

/**
 * @deprecated in favor of using date-fns functions
 */
export const ONE_HOUR_IN_MILLISECONDS =
  ONE_SECOND_IN_MILLISECONDS * ONE_HOUR_IN_SECONDS;

/**
 * @deprecated in favor of using date-fns functions
 */
export const SECONDS_TIMESTAMP_MAX_VALUE = 9999999999;

/**
 * Convert totalSeconds to a Duration object (days, hours, minutes, seconds).
 *
 * @param totalSeconds
 *
 * @see https://date-fns.org/docs/Duration
 *
 * @debt replace this with better implementation using `intervalToDuration` (see link) once we upgrade date-fns beyond v2.13.0
 * @see https://github.com/date-fns/date-fns/issues/229#issuecomment-646124041
 */
export const secondsToDuration = (totalSeconds: number): Duration => {
  const days = Math.floor(totalSeconds / ONE_DAY_IN_SECONDS);
  const remainingSecondsWithoutDays = totalSeconds % ONE_DAY_IN_SECONDS;

  const hours = Math.floor(remainingSecondsWithoutDays / ONE_HOUR_IN_SECONDS);
  const remainingSecondsWithoutHours =
    remainingSecondsWithoutDays % ONE_HOUR_IN_SECONDS;

  const minutes = Math.floor(
    remainingSecondsWithoutHours / ONE_MINUTE_IN_SECONDS
  );
  const remainingSecondsWithoutMinutes =
    remainingSecondsWithoutHours % ONE_MINUTE_IN_SECONDS;

  return { days, hours, minutes, seconds: remainingSecondsWithoutMinutes };
};

/**
 * Format seconds as a string representing the Duration.
 *
 * @example
 *   formatSecondsAsDuration(1000000)
 *   // 11 days 13 hours 46 minutes 40 seconds
 *
 * @param seconds total seconds to be formatted as a duration
 */
export const formatSecondsAsDuration = (seconds: number): string =>
  formatDuration(secondsToDuration(seconds));

/**
 * Format seconds as a string representing the HH:MM:SS duration.
 *
 * @example
 *   formatSecondsAsHHMMSS(6030)
 *   // 1:40:30
 *
 * @param secondsValue total seconds to be formatted as a duration
 */
export const formatSecondsAsHHMMSS = (secondsValue: number): string => {
  const { hours, minutes, seconds } = secondsToDuration(secondsValue);

  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Format time left from now as a string representing the Duration ignoring seconds.
 *
 * @example
 *   getTimeBeforeParty(1626432204)
 *   // 1 month 26 days 20 hours 53 minutes
 *
 * @param startUtcSeconds
 *
 * @see https://date-fns.org/docs/formatDuration
 */
export const getTimeBeforeParty = (startUtcSeconds?: number): string => {
  if (startUtcSeconds === undefined) return "???";

  const startDate = fromUnixTime(startUtcSeconds);
  const now = Date.now();

  if (isAfter(now, startDate)) return "0";

  return formatDuration({
    ...intervalToDuration({
      start: now,
      end: startDate,
    }),
    seconds: 0,
  });
};

/**
 * Format dateOrTimestamp as a string representing date.
 *
 * @example
 *   formatDate(1623899620647)
 *   // 'Jun 17th'
 *
 * @param dateOrTimestamp
 *
 * @see https://date-fns.org/docs/format
 */
export const formatDate = (dateOrTimestamp: Date | number): string =>
  isThisYear(dateOrTimestamp)
    ? format(dateOrTimestamp, "MMM do")
    : format(dateOrTimestamp, "MMM do, yyyy");

export interface FormatDateRelativeToNowOptions {
  formatYesterday?: (dateOrTimestamp: Date | number) => string;
  formatToday?: (dateOrTimestamp: Date | number) => string;
  formatTomorrow?: (dateOrTimestamp: Date | number) => string;
  formatOtherDate?: (dateOrTimestamp: Date | number) => string;
}

/**
 * Format dateOrTimestamp as a string representing the date relative to now.
 *
 * These formats can be customised via the options prop if desired.
 *
 * @example Basic Usage
 *   formatDateRelativeToNow(yesterdayDate) // "Yesterday"
 *   formatDateRelativeToNow(todayDate)     // "Today"
 *   formatDateRelativeToNow(tomorrowDate)  // "Tomorrow"
 *   formatDateRelativeToNow(someOtherDate) // "Jun 17th"
 *
 * @example Customised Formats Usage
 *   formatDateRelativeToNow(todayDate, { formatToday: () => "All we have is now!" })
 *   // "All we have is now!"
 *
 * @param dateOrTimestamp
 * @param options
 *
 * @see https://date-fns.org/docs/format
 */
export const formatDateRelativeToNow = (
  dateOrTimestamp: Date | number,
  options?: FormatDateRelativeToNowOptions
): string => {
  const {
    formatYesterday = () => "Yesterday",
    formatToday = () => "Today",
    formatTomorrow = () => "Tomorrow",
    formatOtherDate = formatDate,
  } = options ?? {};

  if (isYesterday(dateOrTimestamp)) return formatYesterday(dateOrTimestamp);
  if (isToday(dateOrTimestamp)) return formatToday(dateOrTimestamp);
  if (isTomorrow(dateOrTimestamp)) return formatTomorrow(dateOrTimestamp);

  return formatOtherDate(dateOrTimestamp);
};

/**
 * Format dateOrTimestamp as a string representing the time in long localized time format (eg. 12:00 AM).
 *
 * @example
 *   formatTimestampToDisplayHoursMinutes(1623899620647)
 *   // '1:13 PM'
 *
 * @param dateOrTimestamp
 *
 * @see https://date-fns.org/docs/format
 */
export const formatTimeLocalised = (dateOrTimestamp: Date | number): string =>
  format(dateOrTimestamp, "p");

export function oneHourAfterTimestamp(timestamp: number) {
  return timestamp + ONE_HOUR_IN_SECONDS;
}

export const getHoursAgoInMilliseconds = (hours: number) =>
  getTime(subHours(Date.now(), hours));

export const getCurrentTimeInMilliseconds = () => Date.now();

export const getDaysAgoInSeconds = (days: number) =>
  getUnixTime(subDays(Date.now(), days));

export const getSecondsFromStartOfDay = (utcSeconds: number) => {
  const time = fromUnixTime(utcSeconds);

  return differenceInSeconds(time, startOfDay(time));
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
//   The static Date.now() method returns the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
export const getCurrentTimeInUTCSeconds = () => getUnixTime(Date.now());

/**
 * Format UTC seconds as a string representing relative date from now.
 *
 * @example
 *   formatUtcSecondsRelativeToNow(1618509600)
 *   // 'today at 9:00 PM'
 *
 * @param utcSeconds
 *
 * @see https://date-fns.org/docs/formatRelative
 */
export const formatUtcSecondsRelativeToNow = (utcSeconds: number) =>
  formatRelative(fromUnixTime(utcSeconds), Date.now());

export const normalizeTimestampToMilliseconds = (timestamp: number) => {
  const isTimestampInMilliSeconds = timestamp > SECONDS_TIMESTAMP_MAX_VALUE;

  // @debt get rid of ONE_SECOND_IN_MILLISECONDS and use date-fns function
  return isTimestampInMilliSeconds
    ? timestamp
    : timestamp * ONE_SECOND_IN_MILLISECONDS;
};

export const getDayInterval = (date: Date | number) => ({
  start: startOfDay(date),
  end: endOfDay(date),
});
