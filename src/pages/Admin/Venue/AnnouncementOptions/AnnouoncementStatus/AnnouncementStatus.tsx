import React from "react";
import classNames from "classnames";

import { BannerFormData } from "types/banner";

import iconCheck from "assets/icons/icon-checkmark.svg";
import iconClose from "assets/icons/icon-close.svg";

import "./AnnouncementStatus.scss";

export interface AnnouncementStatusProps {
  banner?: BannerFormData;
}

const ENABLED = "enabled";
const DISABLED = "disabled";

export const AnnouncementStatus: React.FC<AnnouncementStatusProps> = ({
  banner,
}) => {
  const fullscreenImg = banner?.isFullScreen ? iconCheck : iconClose;
  const closeImg = banner?.isCloseButton ? iconCheck : iconClose;

  const fullscreenText = banner?.isFullScreen ? ENABLED : DISABLED;
  const forceText = banner?.isCloseButton ? ENABLED : DISABLED;

  const urlText = banner?.isActionButton ? banner?.buttonUrl : "blank";

  const urlTextClassNames = classNames("AnnouncementStatus__url-text", {
    "AnnouncementStatus__url-text--empty": !banner?.isActionButton,
  });

  if (!banner?.content) return null;

  return (
    <div className="AnnouncementStatus">
      <div className="AnnouncementStatus__buttons">
        <span className="AnnouncementStatus__checkbox">
          <img
            src={fullscreenImg}
            alt="on"
            className="AnnouncementStatus__img"
          />
          FullScreen {fullscreenText}
        </span>
        <span className="AnnouncementStatus__checkbox">
          <img src={closeImg} alt="off" className="AnnouncementStatus__img" />
          Force funnel {forceText}
        </span>
      </div>
      <div className="AnnouncementStatus__url">
        URL: <span className={urlTextClassNames}>{urlText}</span>
      </div>
    </div>
  );
};
