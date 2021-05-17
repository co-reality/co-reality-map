import React from "react";

import { AnyVenue } from "types/venues";

import { InformationLeftColumn } from "components/organisms/InformationLeftColumn";
import InformationCard from "components/molecules/InformationCard";

import "./WithInformationCard.scss";

interface PropsType {
  venue: AnyVenue;
  showInfo?: boolean;
}

export const WithInformationCard: React.FunctionComponent<PropsType> = ({
  venue,
  showInfo = false,
}) => (
  <>
    {showInfo && (
      <InformationLeftColumn iconNameOrPath={venue?.host?.icon || "info"}>
        <InformationCard>
          <p className="information-title">{venue.name}</p>
          {venue.config?.landingPageConfig.subtitle && (
            <p className="information-subtitle">
              {venue.config?.landingPageConfig.subtitle}
            </p>
          )}
          {venue.config?.landingPageConfig.description && (
            <p className="information-description">
              {venue.config?.landingPageConfig.description}
            </p>
          )}
        </InformationCard>
      </InformationLeftColumn>
    )}
  </>
);
