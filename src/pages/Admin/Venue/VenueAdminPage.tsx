import React from "react";

import {
  isCurrentVenueNGRequestedSelector,
  isCurrentVenueNGRequestingSelector,
} from "utils/selectors";

import { IFRAME_TEMPLATES } from "settings";

import { useSelector } from "hooks/useSelector";
import { useIsUserVenueOwner } from "hooks/useIsUserVenueOwner";
import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";

import { LoadingPage } from "components/molecules/LoadingPage";
import { IframeAdmin } from "components/molecules/IframeAdmin";
import { BannerAdmin } from "components/organisms/BannerAdmin";
import { PosterPageAdmin } from "components/organisms/PosterPageAdmin";

import "./VenueAdminPage.scss";

export const VenueAdminPage: React.FC = () => {
  const { profile, user } = useUser();
  const venueId = useVenueId();
  const { currentVenue: venue } = useConnectCurrentVenueNG(venueId);
  const venueRequestStatus = useSelector(isCurrentVenueNGRequestedSelector);
  const venueRequestingStatus = useSelector(isCurrentVenueNGRequestingSelector);

  const isVenueOwner = useIsUserVenueOwner();
  const isVenueLoading = venueRequestingStatus || !venueRequestStatus;
  const isLoggedIn = profile && user;

  if (isVenueLoading) {
    return <LoadingPage />;
  }

  if (!isLoggedIn) {
    return <div className="admin-page-title">You need to log in first.</div>;
  }

  if (!venue) {
    return <div className="admin-page-title">This venue does not exist</div>;
  }

  if (!isVenueOwner) {
    return (
      <div className="admin-page-title">{`You don't have the permissions to access this page`}</div>
    );
  }

  const isIframeVenue = IFRAME_TEMPLATES.includes(venue.template);

  return (
    <>
      <h4 className="admin-page-title">You are editing venue: {venue.name}</h4>
      <BannerAdmin venueId={venueId} venue={venue} />
      {isIframeVenue && <IframeAdmin venueId={venueId} venue={venue} />}
      {venue.template === "posterpage" && user && (
        <PosterPageAdmin user={user} venueId={venueId} venue={venue} />
      )}
    </>
  );
};
