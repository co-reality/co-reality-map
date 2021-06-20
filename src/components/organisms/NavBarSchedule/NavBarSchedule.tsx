import React, { useCallback, useMemo, useState } from "react";
import {
  addDays,
  format,
  fromUnixTime,
  isToday,
  startOfDay,
  startOfToday,
} from "date-fns";
import classNames from "classnames";
import { groupBy } from "lodash";

import { PLATFORM_BRAND_NAME, SCHEDULE_SHOW_DAYS_AHEAD } from "settings";

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

import { SCHEDULE_SHOW_VENUE_DESCRIPTION_IN_NAVBAR } from "settings";

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

  const firstDayOfSchedule = useMemo(() => {
    return scheduledStartDate
      ? startOfDay(fromUnixTime(scheduledStartDate))
      : startOfToday();
  }, [scheduledStartDate]);

  const isScheduleTimeshifted = !isToday(firstDayOfSchedule);

  const {
    isEventsLoading,
    events: relatedVenueEvents = emptyRelatedEvents,
  } = useVenueEvents({
    venueIds: relatedVenueIds,
  });

  const isLoadingSchedule = isLoading || isEventsLoading;

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const weekdays = useMemo(() => {
    const formatDayLabel = (day: Date | number) => {
      if (isScheduleTimeshifted) {
        return format(day, "E, LLL d");
      } else {
        return formatDateRelativeToNow(day, {
          formatOtherDate: (dateOrTimestamp) => format(dateOrTimestamp, "E"),
        });
      }
    };

    return range(SCHEDULE_SHOW_DAYS_AHEAD).map((dayIndex) => {
      const day = addDays(firstDayOfSchedule, dayIndex);
      const classes = classNames("NavBarSchedule__weekday", {
        "NavBarSchedule__weekday--active": dayIndex === selectedDayIndex,
      });

      return (
        <li
          key={day.toISOString()}
          className={classes}
          onClick={() => {
            setSelectedDayIndex(dayIndex);
          }}
        >
          {formatDayLabel(day)}
        </li>
      );
    });
  }, [selectedDayIndex, firstDayOfSchedule, isScheduleTimeshifted]);

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
          ? isEventWithinDate(startOfSelectedDay)
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
    const dayStart = addDays(startOfToday(), selectedDayIndex);
    const allPersonalEvents: PersonalizedVenueEvent[] = relatedVenueEvents
      .map(
        prepareForSchedule({
          day: dayStart,
          usersEvents: userEventIds,
          isForCalendarFile: true,
        })
      )
      .filter((event) => event.isSaved);

    downloadCalendar({
      calendar: createCalendar({ events: allPersonalEvents }),
      calendarName: `${PLATFORM_BRAND_NAME}_Personal`,
    });
  }, [relatedVenueEvents, userEventIds, selectedDayIndex]);

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
      {venueId && SCHEDULE_SHOW_VENUE_DESCRIPTION_IN_NAVBAR && (
        <ScheduleVenueDescription venueId={venueId} />
      )}
      {!isLoadingSchedule && (
        <div className="NavBarSchedule__download-buttons">
          {hasSavedEvents && (
            <Button
              onClick={downloadPersonalEventsCalendar}
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
      <ul className="NavBarSchedule__weekdays">{weekdays}</ul>

      <Schedule isLoading={isLoadingSchedule} {...schedule} />
    </div>
  );
};
