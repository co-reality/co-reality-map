import React from "react";

import "./AnnouncementContainer.scss";

export interface AnnouncementContainerProps {
  isFullScreen?: boolean;
}

export const AnnouncementContainer: React.FC<AnnouncementContainerProps> = ({
  isFullScreen,
  children,
}) => {
  // if (isFullScreen) {
  //   return ();
  // }

  return <div className="AnnouncementContainer">{children}</div>;
};
