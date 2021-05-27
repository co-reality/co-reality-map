import React from "react";
import classNames from "classnames";

import { BannerFormData } from "types/banner";

import iconCheck from "assets/icons/icon-checkmark.svg";
import iconClose from "assets/icons/icon-close.svg";

import "./AnnouncementOptions.scss";

type AnnouncementOptionsProps = {
  banner?: BannerFormData;
};

export const AnnouncementOptions: React.FC<AnnouncementOptionsProps> = ({
  banner,
}) => {
  const fullscreenImg = banner?.isFullScreen ? iconCheck : iconClose;
  const isCloseImg = banner?.isCloseButton ? iconCheck : iconClose;

  const fullscreenText = banner?.isFullScreen ? "enabled" : "disabled";
  const ForceText = banner?.isCloseButton ? "enabled" : "disabled";

  const urlText = banner?.isActionButton ? banner?.buttonUrl : "blank";

  const urlTextClassNames = classNames("AnnouncementOptions__url-text", {
    "AnnouncementOptions__url-text--empty": !banner?.isActionButton,
  });

  if (!banner?.content) return <div />;

  return (
    <div className="AnnouncementOptions">
      <div className="AnnouncementOptions__buttons">
        <span className="AnnouncementOptions__checkbox">
          <img
            src={fullscreenImg}
            alt="on"
            className="AnnouncementOptions__img"
          />
          FullScreen {fullscreenText}
        </span>
        <span className="AnnouncementOptions__checkbox">
          <img
            src={isCloseImg}
            alt="off"
            className="AnnouncementOptions__img"
          />
          Force funnel {ForceText}
        </span>
      </div>
      <div className="AnnouncementOptions__url">
        URL: <span className={urlTextClassNames}>{urlText}</span>
      </div>
    </div>
  );
};
