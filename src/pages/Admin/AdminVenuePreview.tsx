import React, { CSSProperties, useMemo } from "react";
import { AnyVenue, PartyMapVenue, VenueTemplate } from "types/venues";
import { WithId } from "utils/id";
import { PartyMapContainer } from "pages/Account/Venue/VenueMapEdition";
import { ConvertToEmbeddableUrl } from "utils/ConvertToEmbeddableUrl";
import {
  IFRAME_ALLOW,
  PLAYA_IMAGE,
  PLAYA_VENUE_NAME,
  PLAYA_VENUE_STYLES,
} from "settings";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import { AdminVenueRoomsList } from "./AdminVenueRoomsList";

export interface AdminVenuePreviewProps {
  venue: WithId<AnyVenue>;
  containerStyle: CSSProperties;
}

// @debt Refactor this into settings, or types/templates, or similar?
const infoTextByVenue: { [key: string]: string } = {
  [VenueTemplate.themecamp]: "Camp Info:",
  [VenueTemplate.artpiece]: "Art Piece Info:",
  [VenueTemplate.partymap]: "Party Map Info:",
};

export const AdminVenuePreview: React.FC<AdminVenuePreviewProps> = ({
  venue,
  containerStyle,
}) => {
  const templateSpecificListItems = useMemo(() => {
    switch (venue.template) {
      case VenueTemplate.artpiece:
        return (
          <>
            <div>
              <span className="title">iframe URL: </span>
              <span className="content">
                <a href={venue.iframeUrl}>{venue.iframeUrl}</a>
              </span>
            </div>
            <div className="title" style={{ marginTop: 10 }}>
              {" "}
              This is a preview of your art piece:
            </div>
            <p>(Make sure the URL provided is embeddable)</p>
            <div className="iframe-preview-container">
              <iframe
                className="iframe-preview"
                title="art-piece-video"
                src={ConvertToEmbeddableUrl(venue.iframeUrl)}
                frameBorder="0"
                allow={IFRAME_ALLOW}
                allowFullScreen
              />
            </div>
          </>
        );
      case VenueTemplate.zoomroom:
        return (
          <div>
            <span className="title">URL</span>
            <span className="content">
              <a href={venue.zoomUrl} target="_blank" rel="noopener noreferrer">
                {venue.zoomUrl}
              </a>
            </span>
          </div>
        );
      case VenueTemplate.partymap:
      case VenueTemplate.animatemap:
      case VenueTemplate.themecamp:
        const partyMapVenue = venue as WithId<PartyMapVenue>;
        return (
          <div className="content-group" style={{ padding: "5px" }}>
            <span className="title" style={{ fontSize: "20px" }}>
              This is a preview of your camp
            </span>
            <PartyMapContainer
              interactive={false}
              resizable
              coordinatesBoundary={{
                width: 100,
                height: 100,
              }}
              iconsMap={{}}
              backgroundImage={venue.mapBackgroundImageUrl || PLAYA_IMAGE}
              iconImageStyle={PLAYA_VENUE_STYLES.iconImage}
              draggableIconImageStyle={PLAYA_VENUE_STYLES.draggableIconImage}
              venue={partyMapVenue}
            />
          </div>
        );
      default:
        return;
    }
  }, [venue]);

  const venueTypeText = infoTextByVenue[venue.template] ?? "Experience Info:";

  return (
    <div style={containerStyle}>
      <div className="venue-preview">
        <h4
          className="italic"
          style={{ textAlign: "center", fontSize: "30px" }}
        >
          {venueTypeText} {venue.name}
        </h4>
        <div className="heading-group">
          <div style={{ padding: "5px" }}>
            <span className="title" style={{ fontSize: "18px" }}>
              Name:
            </span>
            <span className="content">{venue.name}</span>
          </div>
          <div style={{ padding: "5px" }}>
            <span className="title" style={{ fontSize: "18px" }}>
              Short description:
            </span>
            <span className="content">
              {venue.config?.landingPageConfig.subtitle}
            </span>
          </div>
          <div
            style={{ padding: "5px", display: "flex", alignItems: "center" }}
          >
            <span
              className="title"
              style={{
                fontSize: "18px",
                marginBottom: "1rem",
                marginTop: 0,
              }}
            >
              Long description:
            </span>
            <RenderMarkdown
              text={venue.config?.landingPageConfig.description}
            />
          </div>
        </div>
        <div className="content-group" style={{ display: "flex" }}>
          <div style={{ width: "150px" }}>
            <div className="title" style={{ width: "150px" }}>
              Banner photo
            </div>
            <div className="content">
              <img
                className="icon"
                src={
                  venue.config?.landingPageConfig.bannerImageUrl ??
                  venue.config?.landingPageConfig.coverImageUrl
                }
                alt="icon"
              />
            </div>
          </div>
          <div style={{ width: "150px" }}>
            <div className="title" style={{ width: "150px" }}>
              {PLAYA_VENUE_NAME} icon
            </div>
            <div className="content">
              <img className="icon" src={venue.mapIconImageUrl} alt="icon" />
            </div>
          </div>
          <div style={{ width: "150px" }}>
            <div className="title" style={{ width: "150px" }}>
              Camp logo
            </div>
            <div className="content">
              <img className="icon" src={venue.host?.icon} alt="icon" />
            </div>
          </div>
        </div>
        {templateSpecificListItems}
      </div>
      <AdminVenueRoomsList venue={venue} />
    </div>
  );
};
