import React from "react";
import { Link } from "react-router-dom";

import { AnyVenue } from "types/venues";

import { DEFAULT_VENUE_LOGO } from "settings";

import { WithId } from "utils/id";
import { adminNGSettingsUrl, adminNGVenueUrl } from "utils/url";

import "./AdminVenueCard.scss";

export interface AdminVenueCardProps {
  venue: WithId<AnyVenue>;
}

export const AdminVenueCard: React.FC<AdminVenueCardProps> = ({ venue }) => (
  <div className="AdminVenueCard">
    <div
      className="AdminVenueCard__bg"
      style={{
        backgroundImage: `url(${venue.mapBackgroundImageUrl})`,
      }}
    />
    <div className="AdminVenueCard__info">
      <div
        className="AdminVenueCard__logo"
        style={{
          backgroundImage: `url(${venue.host?.icon ?? DEFAULT_VENUE_LOGO})`,
        }}
      />
      <h3>{venue.name}</h3>
    </div>
    <Link className="AdminVenueCard__button" to={adminNGVenueUrl(venue.id)}>
      Manage Space
    </Link>
    <Link className="AdminVenueCard__button" to={adminNGSettingsUrl(venue.id)}>
      Advanced Settings
    </Link>
  </div>
);
