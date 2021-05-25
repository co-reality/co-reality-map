import React, { useMemo } from "react";
import { Button } from "react-bootstrap";

import {
  isCurrentVenueNGRequestedSelector,
  isCurrentVenueNGRequestingSelector,
} from "utils/selectors";

import { useSelector } from "hooks/useSelector";
import { useIsUserVenueOwner } from "hooks/useIsUserVenueOwner";
import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";
import { useShowHide } from "hooks/useShowHide";

import { LoadingPage } from "components/molecules/LoadingPage";

import { BannerAdmin } from "components/organisms/BannerAdmin";
import { UserProfileModal } from "components/organisms/UserProfileModal";
import { WithNavigationBar } from "components/organisms/WithNavigationBar";

import { AnnouncementMessage } from "components/molecules/AnnouncementMessage";

import "./VenueAdminPage.scss";

export const VenueAdminPage: React.FC = () => {
  const { profile, user } = useUser();
  const venueId = useVenueId();
  const { currentVenue: venue } = useConnectCurrentVenueNG(venueId);
  const venueRequestStatus = useSelector(isCurrentVenueNGRequestedSelector);
  const venueRequestingStatus = useSelector(isCurrentVenueNGRequestingSelector);
  const { isShown, show } = useShowHide();

  const isVenueOwner = useIsUserVenueOwner();
  const isVenueLoading = venueRequestingStatus || !venueRequestStatus;
  const isLoggedIn = profile && user;

  const banner = useMemo(() => {
    return venue?.banner ?? { content: "No announcement" };
  }, [venue]);

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

  return (
    <WithNavigationBar>
      <div className="AdminPage">
        <h4 className="AdminPage__title">
          Current Announcement in Space Title
        </h4>
        {isShown ? (
          <BannerAdmin venueId={venueId} venue={venue} />
        ) : (
          <>
            <AnnouncementMessage banner={banner} />
            <div className="AdminPage__options">
              <div></div>
              <Button onClick={show}>Edit</Button>
            </div>
          </>
        )}
      </div>
      <UserProfileModal venue={venue} />
    </WithNavigationBar>
  );
};
