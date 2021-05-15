import React, { useCallback, useState } from "react";
import classNames from "classnames";

import { useSovereignVenueId } from "hooks/useSovereignVenueId";

import { SchedulePageModal } from "components/organisms/SchedulePageModal/SchedulePageModal";

import "./NavbarSchedule.scss";

export const NavbarSchedule: React.FC = () => {
  const { sovereignVenueId: navbarTitle } = useSovereignVenueId();

  const [isEventScheduleVisible, setEventScheduleVisible] = useState(false);

  const toggleEventSchedule = useCallback(() => {
    setEventScheduleVisible((scheduleVisible) => !scheduleVisible);
  }, []);

  const hideEventSchedule = useCallback(() => {
    setEventScheduleVisible(false);
  }, []);

  const scheduleBackdropClasses = classNames("schedule-dropdown-backdrop", {
    "schedule-dropdown-backdrop--visible": isEventScheduleVisible,
  });

  return (
    <>
      <div
        className={classNames("nav-schedule", {
          "nav-schedule--visible": isEventScheduleVisible,
        })}
        onClick={toggleEventSchedule}
      >
        {navbarTitle} Schedule
      </div>
      <div className={scheduleBackdropClasses} onClick={hideEventSchedule}>
        <SchedulePageModal isVisible={isEventScheduleVisible} />
      </div>
    </>
  );
};
