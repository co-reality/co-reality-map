import React from "react";
import { Modal } from "react-bootstrap";

import { Button } from "components/atoms/Button";

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
              customClass="ConfirmationBannerModal__button ConfirmationBannerModal__button--cancel"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              customClass="ConfirmationBannerModal__button"
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
