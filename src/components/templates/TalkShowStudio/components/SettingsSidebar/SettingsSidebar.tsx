import React, { FC, useState } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

import { FullTalkShowVenue } from "types/venues";

import { WithId } from "utils/id";
import { currentVenueSelectorData } from "utils/selectors";

import { useSelector } from "hooks/useSelector";
import { useUser } from "hooks/useUser";

import { AdminPanel } from "./components/AdminPanel/AdminPanel";

import "./SettingsSidebar.scss";

export interface SettingsSidebarProps {
  venue: WithId<FullTalkShowVenue>;
}

export const SettingsSidebar: FC<SettingsSidebarProps> = ({ venue }) => {
  const [isOpened, setIsOpened] = useState(false);
  const currentVenue = useSelector(currentVenueSelectorData);
  const { userId } = useUser();

  if (!(userId && currentVenue?.owners.includes(userId))) return null;

  const containerStyles = classNames("settings-sidebar", {
    "settings-sidebar--expanded": isOpened,
  });

  return (
    <div className={containerStyles}>
      <div className="header">
        <div
          className="controller"
          onClick={() => {
            setIsOpened(!isOpened);
          }}
        >
          {isOpened ? (
            <FontAwesomeIcon icon={faChevronRight} size="sm" />
          ) : (
            <>
              <FontAwesomeIcon icon={faChevronLeft} size="sm" />
              <FontAwesomeIcon className="second-icon" icon={faCog} size="lg" />
            </>
          )}
        </div>
        <div className="tab">Admin</div>
      </div>
      <div className="tab-content">
        <AdminPanel venue={venue} />
      </div>
    </div>
  );
};
