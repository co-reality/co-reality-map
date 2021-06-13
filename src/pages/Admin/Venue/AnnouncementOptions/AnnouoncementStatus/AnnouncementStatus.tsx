import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

import { BannerFormData } from "types/banner";

import { isDefined } from "utils/types";

import "./AnnouncementStatus.scss";

export interface AnnouncementStatusProps {
  banner?: BannerFormData;
}

const ENABLED__TEXT = "enabled";
const DISABLED__TEXT = "disabled";

export const AnnouncementStatus: React.FC<AnnouncementStatusProps> = ({
  banner,
}) => {
  const fullscreenImg = banner?.isFullScreen ? faCheck : faTimes;
  const closeImg = banner?.hasCloseButton ? faCheck : faTimes;

  const fullscreenText = banner?.isFullScreen ? ENABLED__TEXT : DISABLED__TEXT;
  const forceText = banner?.hasCloseButton ? ENABLED__TEXT : DISABLED__TEXT;

  const urlText = banner?.isActionButton ? banner?.buttonUrl : "blank";

  const urlTextClassNames = classNames("AnnouncementStatus__url-text", {
    "AnnouncementStatus__url-text--empty": !banner?.isActionButton,
  });

  if (isDefined(!banner?.content)) return null;

  return (
    <div className="AnnouncementStatus">
      <div className="AnnouncementStatus__buttons">
        <span className="AnnouncementStatus__checkbox">
          <FontAwesomeIcon
            icon={fullscreenImg}
            className="AnnouncementStatus__img"
          />
          FullScreen {fullscreenText}
        </span>
        <span className="AnnouncementStatus__checkbox">
          <FontAwesomeIcon
            icon={closeImg}
            className="AnnouncementStatus__img"
          />
          Force funnel {forceText}
        </span>
      </div>
      <div className="AnnouncementStatus__url">
        URL: <span className={urlTextClassNames}>{urlText}</span>
      </div>
    </div>
  );
};
