import React from "react";
import { Button, Modal } from "react-bootstrap";

import "./ConfirmationBannerModal.scss";

interface ConfirmationBannerModalProps {
  show?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmationBannerModal: React.FC<ConfirmationBannerModalProps> = ({
  show,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Body>
        <div className="ConfirmationBannerModal">
          <h2 className="ConfirmationBannerModal__header">
            Erase your beautiful work?
          </h2>
          <div className="ConfirmationBannerModal__message">Are you sure?</div>
          <div className="ConfirmationBannerModal__buttons">
            <Button
              variant="secondary"
              className="ConfirmationBannerModal__cancel-button"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="ConfirmationBannerModal__confirm-button"
              onClick={onConfirm}
            >
              Clear & Save
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
