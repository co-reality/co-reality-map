import React from "react";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";

import { DEFAULT_MAP_BACKGROUND } from "settings";

import { adminNGSettigsUrl } from "utils/url";

import { useVenueId } from "hooks/useVenueId";

import { Container } from "pages/Account/Venue/VenueMapEdition/Container";
import { ButtonNG } from "components/atoms/ButtonNG/ButtonNG";
import { RunTabToolbar } from "components/organisms/AdminVenueView/components/RunTabToolbar/RunTabToolbar";
import { RunTabRooms } from "components/organisms/AdminVenueView/components/RunTabRooms/RunTabRooms";
import { RunTabUsers } from "components/organisms/AdminVenueView/components/RunTabUsers/RunTabUsers";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";

import "./RunTabView.scss";

const noop = () => undefined;

export const RunTabView: React.FC = () => {
  const venueId = useVenueId();
  const { currentVenue: venue } = useConnectCurrentVenueNG(venueId);

  if (!venue) {
    return <>{`Venue doesn't exit`}</>;
  }

  return (
    <div className="RunTabView">
      <div className="RunTabView__sidebar">
        <div className="RunTabView__title">Run your space</div>
        <ButtonNG
          className="RunTabView__advanced"
          isLink={true}
          linkTo={adminNGSettigsUrl(venueId)}
          iconName={faCog}
        >
          Advanced Settings
        </ButtonNG>
        <RunTabUsers venueId={venueId} />
      </div>
      <div className="RunTabView__main">
        <div className="RunTabView__toolbar RunTabView--spacing">
          <RunTabToolbar venueId={venueId} />
        </div>
        <div className="RunTabView__map RunTabView--spacing">
          <Container
            interactive
            resizable
            coordinatesBoundary={{
              width: 100,
              height: 100,
            }}
            onChange={noop}
            snapToGrid={false}
            iconsMap={{}}
            backgroundImage={
              venue?.mapBackgroundImageUrl ?? DEFAULT_MAP_BACKGROUND
            }
            iconImageStyle={{}}
            draggableIconImageStyle={{}}
            otherIconsStyle={{ opacity: 0.4 }}
            otherIcons={{}}
          />
        </div>
        <div className="RunTabView__cards RunTabView--spacing">
          <RunTabRooms venue={venue} />
        </div>
      </div>
    </div>
  );
};
