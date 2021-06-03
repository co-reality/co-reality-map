import React, { useRef } from "react";
import { Overlay } from "react-bootstrap";
import { DEFAULT_MAP_ICON_URL, PLAYA_VENUE_SIZE } from "settings";
import { AnyVenue } from "types/venues";
import { WithId } from "utils/id";

interface Props {
  isLive: boolean;
  venue: WithId<AnyVenue>;
  onClick: () => void;
  onMouseOver: (event: React.MouseEvent) => void;
  onMouseLeave: (event: React.MouseEvent) => void;
  selectedVenueId: string | undefined;
}

const PlayaVenue = ({
  isLive,
  venue,
  onClick,
  onMouseOver,
  onMouseLeave,
  selectedVenueId,
}: Props) => {
  const venueRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <div
        className={`venue ${isLive ? "live" : ""}`}
        style={{
          top: venue.placement?.y || 0 - PLAYA_VENUE_SIZE / 2,
          left: venue.placement?.x || 0 - PLAYA_VENUE_SIZE / 2,
          position: "absolute",
        }}
        onClick={onClick}
        ref={venueRef}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
      >
        <span className="img-vcenter-helper" />
        <img
          className="venue-icon"
          src={DEFAULT_MAP_ICON_URL}
          alt={`${venue.name} Icon`}
        />
        {selectedVenueId === venue.id && <div className="selected" />}
      </div>
      <Overlay target={venueRef.current} show={true}>
        {({ placement, arrowProps, show: _show, popper, ...props }) => (
          // @ts-expect-error
          <div
            {...props}
            style={{
              ...props.style,
              padding: "10px",
            }}
          >
            <div className="playa-venue-text">
              <div className="playa-venue-maininfo">
                <div className="playa-venue-title">{venue?.name}</div>
              </div>
            </div>
          </div>
        )}
      </Overlay>
    </>
  );
};

export default PlayaVenue;
