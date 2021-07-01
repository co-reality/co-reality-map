import React from "react";

import { Banner } from "types/banner";

import { Button } from "components/atoms/Button";

import { AnnouncementStatus } from "../AnnouncementStatus";

import "./AnnouncementOptions.scss";

export interface AnnouncementOptionsProps {
  banner?: Banner;
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
        <Button onClick={onEdit} customClass="AnnouncementOptions__edit-button">
          Edit
        </Button>
      </div>
    </div>
  );
};
