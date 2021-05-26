import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

import "./AnnouncementContainer.scss";

export interface AnnouncementContainerProps {
  isFullScreen?: boolean;
}

export const AnnouncementContainer: React.FC<AnnouncementContainerProps> = ({
  isFullScreen,
  children,
}) => {
  const [showAnnouncement, setShowAnnouncement] = useState(isFullScreen);

  useEffect(() => {
    setShowAnnouncement(isFullScreen);
  }, [isFullScreen]);

  if (isFullScreen) {
    return (
      <Modal
        contentClassName="AnnouncementModalContainer"
        show={showAnnouncement}
        onHide={() => setShowAnnouncement(false)}
        centered
      >
        <Modal.Body>{children}</Modal.Body>
      </Modal>
    );
  }

  return <div className="AnnouncementContainer">{children}</div>;
};
