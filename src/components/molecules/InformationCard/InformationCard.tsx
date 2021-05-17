import React from "react";
import classNames from "classnames";

import "./InformationCard.scss";

export interface InformationCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const InformationCard: React.FC<InformationCardProps> = ({
  title,
  children,
  className,
}) => (
  <div className={classNames("information-card-container", className)}>
    {title && <h4 className="title">{title}</h4>}
    <div className="information-card-text">{children}</div>
  </div>
);

export default InformationCard;
