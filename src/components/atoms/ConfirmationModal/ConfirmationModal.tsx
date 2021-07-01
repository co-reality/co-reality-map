import React, { FC, useCallback, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { isTruthy } from "utils/types";

import "./ConfirmationModal.scss";

interface ConfirmationModalProps {
  show?: boolean;
  header?: string;
  message: string;
  cancelBtnLabel?: string;
  saveBtnLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  containerClassName?: string;
  headerClassName?: string;
  messageClassName?: string;
  buttonsContainerClassName?: string;
  buttonClassName?: string;
  cancelButtonClassName?: string;
  isCentered?: boolean;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  show,
  header,
  message,
  onConfirm,
  onCancel,
  cancelBtnLabel = "No",
  saveBtnLabel = "Yes",
  containerClassName = "confirmation-modal",
  headerClassName = "confirm-header",
  messageClassName = "confirm-message",
  buttonsContainerClassName = "confirmation-buttons",
  buttonClassName = "cancel-button",
  cancelButtonClassName = "confirm-button",
  isCentered = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const confirm = useCallback(() => {
    onConfirm();
    hide();
  }, [onConfirm, hide]);

  const cancel = useCallback(async () => {
    onCancel && (await onCancel());
    hide();
  }, [onCancel, hide]);

  const hasHeader = isTruthy(header);

  const isShown = show !== undefined ? show : isVisible;

  return (
    <Modal show={isShown} onHide={hide} centered={isCentered}>
      <Modal.Body>
        <div className={containerClassName}>
          {hasHeader && <h2 className={headerClassName}>{header}</h2>}
          <div className={messageClassName}>{message}</div>
          <div className={buttonsContainerClassName}>
            <Button className={cancelButtonClassName} onClick={cancel}>
              {cancelBtnLabel}
            </Button>
            <Button className={buttonClassName} onClick={confirm}>
              {saveBtnLabel}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
