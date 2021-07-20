import React, { MouseEventHandler, useCallback } from "react";
import classNames from "classnames";
import { useCss } from "react-use";
import { minutesToHours } from "date-fns";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark as solidBookmark,
  faExpandAlt as solidExpand,
  faCompressAlt as solidCompress,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBookmark as regularBookmark,
  faSquare as regularSquare,
} from "@fortawesome/free-regular-svg-icons";

import {
  SCHEDULE_HOUR_COLUMN_WIDTH_PX,
  SCHEDULE_LONG_EVENT_LENGTH_MIN,
  SCHEDULE_MEDIUM_EVENT_LENGTH_MIN,
  SCHEDULE_SHORT_EVENT_LENGTH_MIN,
} from "settings";

import {
  addEventToPersonalizedSchedule,
  removeEventFromPersonalizedSchedule,
} from "api/profile";

import { PersonalizedVenueEvent } from "types/venues";

import { isEventLive } from "utils/event";

import { useUser } from "hooks/useUser";
import { useShowHide } from "hooks/useShowHide";

import { EventModal } from "components/organisms/EventModal";
import { calcStartPosition } from "components/molecules/Schedule/utils";

import "./ScheduleEvent.scss";

const ScheduleEventBookmarkClass = "ScheduleEvent__bookmark";

export interface ScheduleEventProps {
  event: PersonalizedVenueEvent;
  personalizedEvent?: boolean;
  scaleFactor: number;
  scheduleStartHour: number;
}

export const ScheduleEvent: React.FC<ScheduleEventProps> = ({
  event,
  scaleFactor,
  scheduleStartHour,
  personalizedEvent: isPersonalizedEvent = false,
}) => {
  const { userId } = useUser();

  const eventWidthPx = minutesToHours(
    event.duration_minutes * SCHEDULE_HOUR_COLUMN_WIDTH_PX
  );

  const expandedEventPx =
    minutesToHours(SCHEDULE_LONG_EVENT_LENGTH_MIN) *
    SCHEDULE_HOUR_COLUMN_WIDTH_PX;

  const eventMarginLeftPx = calcStartPosition(
    event.start_utc_seconds,
    scheduleStartHour
  );

  const containerCssVars = useCss({
    "--event--margin-left": `${eventMarginLeftPx * scaleFactor}px`,
    "--event--width": `${eventWidthPx * scaleFactor}px`,
    "--event--expanded-width": `${expandedEventPx}px`,
  });

  const isEventFullLength =
    event.duration_minutes < SCHEDULE_LONG_EVENT_LENGTH_MIN;
  const isEventLong = event.duration_minutes > SCHEDULE_MEDIUM_EVENT_LENGTH_MIN;
  const isEventShort =
    event.duration_minutes <= SCHEDULE_SHORT_EVENT_LENGTH_MIN;

  const containerClasses = classNames(
    "ScheduleEvent",
    {
      "ScheduleEvent--live": isEventLive(event),
      "ScheduleEvent--users": isPersonalizedEvent,
      "ScheduleEvent--short": !isEventLong,
      "ScheduleEvent--expandable": isEventFullLength,
    },
    containerCssVars
  );

  const expandClasses = classNames("ScheduleEvent__expand", {
    "ScheduleEvent__expand--hidden": isEventShort,
    "ScheduleEvent__expand--marged": !isEventLong,
    "ScheduleEvent__expand--padded": isEventLong,
    "ScheduleEvent__expand--live": isEventLive(event),
  });

  const bookmarkEvent: MouseEventHandler<HTMLDivElement> = useCallback(() => {
    if (!userId || !event.id) return;

    event.isSaved
      ? removeEventFromPersonalizedSchedule({ event, userId })
      : addEventToPersonalizedSchedule({ event, userId });
  }, [userId, event]);

  const {
    isShown: isEventModalVisible,
    show: showEventModal,
    hide: hideEventModal,
  } = useShowHide();

  const onEventBoxClick = useCallback(
    (e) => {
      if (e.target.closest(`.${ScheduleEventBookmarkClass}`)) return;

      showEventModal();
    },
    [showEventModal]
  );

  return (
    <>
      <div className={containerClasses} onClick={onEventBoxClick}>
        <button className={expandClasses}>
          <FontAwesomeIcon
            icon={regularSquare}
            className="ScheduleEvent__expand--square"
          />
          <FontAwesomeIcon
            icon={solidExpand}
            className="ScheduleEvent__expand--arrows"
          />
          <FontAwesomeIcon
            icon={solidCompress}
            className="ScheduleEvent__expand--arrows--out"
          />
        </button>

        <div className="ScheduleEvent__info">
          <div className="ScheduleEvent__title">{event.name}</div>
          <div className="ScheduleEvent__host">by {event.host}</div>
        </div>

        <div className="ScheduleEvent__bookmark" onClick={bookmarkEvent}>
          <FontAwesomeIcon
            icon={event.isSaved ? solidBookmark : regularBookmark}
          />
        </div>
      </div>

      <EventModal
        show={isEventModalVisible}
        onHide={hideEventModal}
        event={event}
      />
    </>
  );
};
