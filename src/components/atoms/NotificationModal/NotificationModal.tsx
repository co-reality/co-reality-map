import React, { FC, useCallback, useState } from "react";
import { Button, Modal } from "react-bootstrap";

import "./NotificationModal.scss";

interface NotificationModalProps {
  show?: boolean;
  message: string;
  buttonTitle: string;
  onConfirm?: () => void;
}

export const NotificationModal: FC<NotificationModalProps> = ({
  show,
  message,
  buttonTitle,
  onConfirm,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const confirm = useCallback(() => {
    onConfirm && onConfirm();
    hide();
  }, [onConfirm, hide]);

  const isShown = show !== undefined ? show : isVisible;

  return (
    <Modal show={isShown} onHide={hide}>
      <Modal.Body>
        <div className="confirmation-modal">
          <div className="confirm-message">{message}</div>
          <div className="confirmation-buttons">
            <Button className="confirm-button" onClick={confirm}>
              {buttonTitle}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
