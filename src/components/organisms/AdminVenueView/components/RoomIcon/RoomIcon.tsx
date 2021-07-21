import React from "react";

import "./RoomIcon.scss";

export interface RoomIconProps {
  src: string;
  className?: string;
}

export const RoomIcon: React.FC<RoomIconProps> = ({ src, className }) => (
  <div className={"RoomIcon RoomIcon__wrapper " + className}>
    <img className="RoomIcon__image" src={src} alt="Room icon" />
  </div>
);
