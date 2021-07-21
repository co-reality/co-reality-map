import React, { useCallback, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  fromUnixTime,
  isBefore,
  startOfDay,
  startOfToday,
} from "date-fns";
import classNames from "classnames";
import { groupBy } from "lodash";

import { PLATFORM_BRAND_NAME, SCHEDULE_MAX_DAYS_AHEAD } from "settings";

import {
  LocationEvents,
  PersonalizedVenueEvent,
  VenueEvent,
  VenueLocation,
} from "types/venues";

import { createCalendar, downloadCalendar } from "utils/calendar";
import {
  isEventWithinDate,
  isEventWithinDateAndNotFinished,
} from "utils/event";
import { WithVenueId } from "utils/id";
import { range } from "utils/range";
import { formatDateRelativeToNow } from "utils/time";
import { isDefined } from "utils/types";

import { useRelatedVenues } from "hooks/useRelatedVenues";
import { useUser } from "hooks/useUser";
import { useVenueEvents } from "hooks/events";

import { Button } from "components/atoms/Button";
import { Schedule } from "components/molecules/Schedule";
import { ScheduleVenueDescription } from "components/molecules/ScheduleVenueDescription";

import {
  buildLocationString,
  extractLocation,
  prepareForSchedule,
} from "./utils";

import "./NavBarSchedule.scss";

const emptyRelatedEvents: WithVenueId<VenueEvent>[] = [];

export interface ScheduleDay {
  isToday: boolean;
  scheduleDate: Date;
  locatedEvents: LocationEvents[];
  personalEvents: PersonalizedVenueEvent[];
}

export const emptyPersonalizedSchedule = {};
export interface NavBarScheduleProps {
  isVisible?: boolean;
  venueId: string;
}

export const NavBarSchedule: React.FC<NavBarScheduleProps> = ({
  isVisible,
  venueId,
}) => {
  const { userWithId } = useUser();
  const userEventIds =
    userWithId?.myPersonalizedSchedule ?? emptyPersonalizedSchedule;

  const {
    isLoading,
    relatedVenues,
    relatedVenueIds,
    sovereignVenue,
  } = useRelatedVenues({
    currentVenueId: venueId,
  });

  const scheduledStartDate = sovereignVenue?.start_utc_seconds;
  const scheduledEndDate = sovereignVenue?.end_utc_seconds;

  const { firstDayOfSchedule, isScheduleTimeshifted } = useMemo(() => {
    const today = startOfToday();
    const firstDayOfEvent = scheduledStartDate
      ? startOfDay(fromUnixTime(scheduledStartDate))
      : today;

    const isScheduleTimeshifted = isBefore(today, firstDayOfEvent);

    const firstDayOfSchedule = isScheduleTimeshifted ? firstDayOfEvent : today;

    return {
      firstDayOfSchedule,
      isScheduleTimeshifted,
    };
  }, [scheduledStartDate]);

  const lastDayOfSchedule = useMemo(() => {
    return scheduledEndDate
      ? startOfDay(fromUnixTime(scheduledEndDate))
      : undefined;
  }, [scheduledEndDate]);
  const {
    isEventsLoading,
    events: relatedVenueEvents = emptyRelatedEvents,
  } = useVenueEvents({
    venueIds: relatedVenueIds,
  });

  const isLoadingSchedule = isLoading || isEventsLoading;

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // TODO: extract a new useMemo'd  const startOfSelectedDay = addDays(firstDayOfSchedule, selectedDayIndex);
  //  Then reuse that in all the places that are currently duplicating this logic
  const renderedScheduleDayTabs = useMemo(() => {
    const formatDayLabel = (day: Date | number) => {
      if (isScheduleTimeshifted) {
        return format(day, "E, LLL d");
      } else {
        return formatDateRelativeToNow(day, {
          formatOtherDate: (dateOrTimestamp) => format(dateOrTimestamp, "E"),
        });
      }
    };

    // we add 1 day so that we will still show the last day on the schedule
    const daysTillScheduleEnded = lastDayOfSchedule
      ? Math.max(
          0,
          differenceInCalendarDays(
            addDays(lastDayOfSchedule, 1),
            startOfToday()
          )
        )
      : undefined;

    const scheduleDaysToShowCount = isDefined(daysTillScheduleEnded)
      ? Math.min(daysTillScheduleEnded, SCHEDULE_MAX_DAYS_AHEAD)
      : SCHEDULE_MAX_DAYS_AHEAD;

    return range(scheduleDaysToShowCount).map((dayIndex) => {
      const day = addDays(firstDayOfSchedule, dayIndex);
      const classes = classNames("NavBarSchedule__weekday", {
        "NavBarSchedule__weekday--active": dayIndex === selectedDayIndex,
      });

      const formattedDay = formatDayLabel(day);

      return (
        <li
          key={day.toISOString()}
          className={classes}
          onClick={() => {
            setSelectedDayIndex(dayIndex);
          }}
        >
          <button
            aria-label={formattedDay}
            className="NavBarSchedule__weekday-button"
          >
            {formattedDay}
          </button>
        </li>
      );
    });
  }, [
    isScheduleTimeshifted,
    firstDayOfSchedule,
    lastDayOfSchedule,
    selectedDayIndex,
  ]);

  const getEventLocation = useCallback(
    (locString: string): VenueLocation => {
      const [venueId, roomTitle] = extractLocation(locString);
      const venueName = relatedVenues.find((venue) => venue.id === venueId)
        ?.name;
      return { venueId, venueName, roomTitle: roomTitle || undefined };
    },
    [relatedVenues]
  );

  const schedule: ScheduleDay = useMemo(() => {
    const startOfSelectedDay = addDays(firstDayOfSchedule, selectedDayIndex);
    const daysEvents = relatedVenueEvents
      .filter(
        isScheduleTimeshifted
          ? // @debt do we need this ternary here? Can we just always use one of isEventWithinDate / isEventWithinDateAndNotFinished ?
            isEventWithinDate(startOfSelectedDay)
          : isEventWithinDateAndNotFinished(startOfSelectedDay)
      )
      .map(
        prepareForSchedule({
          day: startOfSelectedDay,
          usersEvents: userEventIds,
        })
      );

    const locatedEvents: LocationEvents[] = Object.entries(
      groupBy(daysEvents, buildLocationString)
    ).map(([group, events]) => ({
      events,
      location: getEventLocation(group),
    }));

    return {
      locatedEvents,
      isToday: selectedDayIndex === 0,
      scheduleDate: startOfSelectedDay,
      personalEvents: daysEvents.filter((event) => event.isSaved),
    };
  }, [
    relatedVenueEvents,
    userEventIds,
    selectedDayIndex,
    getEventLocation,
    firstDayOfSchedule,
    isScheduleTimeshifted,
  ]);

  const hasSavedEvents = schedule.personalEvents.length > 0;

  const downloadPersonalEventsCalendar = useCallback(() => {
    const startOfSelectedDay = addDays(firstDayOfSchedule, selectedDayIndex);
    // @debt this seems to only download events for the currently selected day, yet the UI implies as though it will download all of my events
    const allPersonalEvents: PersonalizedVenueEvent[] = relatedVenueEvents
      .map(
        prepareForSchedule({
          day: startOfSelectedDay,
          usersEvents: userEventIds,
          isForCalendarFile: true,
        })
      )
      .filter((event) => event.isSaved);

    downloadCalendar({
      calendar: createCalendar({ events: allPersonalEvents }),
      calendarName: `${PLATFORM_BRAND_NAME}_Personal`,
    });
  }, [firstDayOfSchedule, selectedDayIndex, relatedVenueEvents, userEventIds]);

  const downloadAllEventsCalendar = useCallback(() => {
    downloadCalendar({
      calendar: createCalendar({ events: relatedVenueEvents }),
      calendarName: `${PLATFORM_BRAND_NAME}_Full`,
    });
  }, [relatedVenueEvents]);

  const containerClasses = classNames("NavBarSchedule", {
    "NavBarSchedule--show": isVisible,
  });

  return (
    <div className={containerClasses}>
      {venueId && <ScheduleVenueDescription venueId={venueId} />}
      {!isLoadingSchedule && (
        <div className="NavBarSchedule__download-buttons">
          {hasSavedEvents && (
            <Button
              onClick={downloadPersonalEventsCalendar}
              // @debt downloadPersonalEventsCalendar seems to only download events for the currently selected day,
              //  yet the UI here implies as though it will download all of my events
              customClass="NavBarSchedule__download-schedule-btn"
            >
              Download your schedule
            </Button>
          )}

          <Button
            onClick={downloadAllEventsCalendar}
            customClass="NavBarSchedule__download-schedule-btn"
          >
            Download full schedule
          </Button>
        </div>
      )}

      {/* TODO: refactor this to be cleaner + follow our standards better */}
      {renderedScheduleDayTabs.length > 0 ? (
        <>
          <ul className="NavBarSchedule__weekdays">
            {renderedScheduleDayTabs}
          </ul>

          <Schedule isLoading={isLoadingSchedule} {...schedule} />
        </>
      ) : (
        // TODO: Improve how this displays
        <div>Scheduled events have ended</div>
      )}
    </div>
  );
};
