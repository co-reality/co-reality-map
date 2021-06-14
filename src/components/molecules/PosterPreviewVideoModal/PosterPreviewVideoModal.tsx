import React from "react";
import Modal from "react-bootstrap/Modal";

import { IFRAME_ALLOW } from "settings";

import "./PosterPreviewVideoModal.scss";

export interface PosterPreviewVideoModalProps {
  isVisible: boolean;
  onHide: () => void;
  introVideoUrl: string;
  title?: string;
  actionButton?: JSX.Element;
}

export const PosterPreviewVideoModal: React.FC<PosterPreviewVideoModalProps> = ({
  isVisible,
  onHide,
  introVideoUrl,
  title,
  actionButton,
}) => {
  return (
    <Modal
      show={isVisible}
      onHide={onHide}
      dialogClassName="PosterPreviewVideoModal"
      centered
      size="lg"
      modal
    >
      {title && <p className="PosterPreviewVideoModal__title">{title}</p>}
      <iframe
        className="PosterPreviewVideoModal__iframe"
        title="PosterPreviewVideoModal-iframe"
        src={introVideoUrl}
        allow={IFRAME_ALLOW}
        allowFullScreen
      />
      {actionButton}
    </Modal>
  );
};
