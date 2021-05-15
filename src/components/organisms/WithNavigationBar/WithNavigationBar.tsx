import React, { useCallback } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory } from "react-router";
import classNames from "classnames";

import { venueInsideUrl } from "utils/url";
import { currentVenueSelectorData } from "utils/selectors";

import { useVenueId } from "hooks/useVenueId";
import { useSelector } from "hooks/useSelector";

import { NavBar } from "components/molecules/NavBar";
import { NavSearchBar } from "components/molecules/NavSearchBar";
import { Footer } from "components/molecules/Footer";
import { NavbarSchedule } from "components/molecules/NavbarSchedule";
import { VenuePartygoers } from "components/molecules/VenuePartygoers";
import { GiftTicketModal } from "components/molecules/GiftTicketModal/GiftTicketModal";

import "./WithNavigationBar.scss";
import { NavBarRadio } from "components/molecules/NavBar/components/NavBarRadio";

interface PropsType {
  children: React.ReactNode;
  redirectionUrl?: string;
  fullscreen?: boolean;
  hasBackButton?: boolean;
}

export const WithNavigationBar: React.FunctionComponent<PropsType> = ({
  redirectionUrl,
  fullscreen,
  children,
}) => {
  const venueId = useVenueId();
  const venue = useSelector(currentVenueSelectorData);
  const history = useHistory();
  const navigateToHomepage = useCallback(() => {
    const venueLink =
      redirectionUrl ?? venueId ? venueInsideUrl(venueId ?? "") : "/";

    if (history.location.pathname !== venueLink) {
      history.push(venueLink);
    }
  }, [history, redirectionUrl, venueId]);

  const leftSlot = venue && (
    <>
      <NavbarSchedule />
      <VenuePartygoers />
    </>
  );

  const rightSlot = (
    <>
      {venue && <NavSearchBar />}

      {venue?.showGiftATicket && (
        <OverlayTrigger
          trigger="click"
          placement="bottom-end"
          rootClose={true}
          overlay={
            <Popover id="gift-popover">
              <Popover.Content>
                <GiftTicketModal />
              </Popover.Content>
            </Popover>
          }
        >
          <span className="private-chat-icon">
            <div className="navbar-link-gift" />
          </span>
        </OverlayTrigger>
      )}

      {venue && <NavBarRadio />}
    </>
  );

  const navBarProps = { leftSlot, rightSlot };

  return (
    <>
      <NavBar {...navBarProps} onClickLogo={navigateToHomepage} />
      <div
        className={classNames("navbar-margin", {
          fullscreen: fullscreen,
        })}
      >
        {children}
      </div>
      <Footer />
    </>
  );
};

/**
 * @deprecated use named export instead
 */
export default WithNavigationBar;
