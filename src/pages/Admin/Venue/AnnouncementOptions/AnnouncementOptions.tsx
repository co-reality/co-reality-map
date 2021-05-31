import React from "react";
import { Button } from "react-bootstrap";

import { BannerFormData } from "types/banner";

import { AnnouncementStatus } from "./AnnouoncementStatus";

import "./AnnouncementOptions.scss";

export interface AnnouncementOptionsProps {
  banner?: BannerFormData;
  onEdit: () => void;
}

export const AnnouncementOptions: React.FC<AnnouncementOptionsProps> = ({
  banner,
  onEdit,
}) => {
  return (
    <div className="AnnouncementOptions">
      <div className="AnnouncementOptions__left-side">
        <AnnouncementStatus banner={banner} />
      </div>
      <div className="AnnouncementOptions__right-side">
        <Button onClick={onEdit} className="AnnouncementOptions__edit-button">
          Edit
        </Button>
      </div>
    </div>
  );
};
