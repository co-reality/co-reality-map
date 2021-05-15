import React, { ReactNode, useCallback } from "react";

import { currentVenueSelectorData, parentVenueSelector } from "utils/selectors";
import { venueInsideUrl } from "utils/url";

import { useSelector } from "hooks/useSelector";
import { useFirestoreConnect } from "hooks/useFirestoreConnect";
import { useUser } from "hooks/useUser";

import { NavBarLogin } from "components/molecules/NavBar/components/NavBarLogin";
import { NavBarProfile } from "components/molecules/NavBar/components/NavBarProfile";

import "./NavBar.scss";
import "./playa.scss";

export interface NavBarPropsType {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  onClickLogo?: () => void;
}

export const NavBar: React.FC<NavBarPropsType> = ({
  leftSlot,
  rightSlot,
  onClickLogo,
}) => {
  const venue = useSelector(currentVenueSelectorData);
  const venueParentId = venue?.parentId;
  const parentVenue = useSelector(parentVenueSelector);
  const { user } = useUser();

  const parentVenueId = venue?.parentId ?? "";
  const backToParentVenue = useCallback(() => {
    window.location.href = venueInsideUrl(parentVenueId);
  }, [parentVenueId]);

  // @debt Move connect from Navbar to a hook
  useFirestoreConnect(
    venueParentId
      ? {
          collection: "venues",
          doc: venueParentId,
          storeAs: "parentVenue",
        }
      : undefined
  );

  return (
    <>
      <header>
        <div className="navbar navbar_playa nonplaya">
          <div className="navbar-container">
            <div className="nav-logos">
              <div className="nav-sparkle-logo" onClick={onClickLogo}>
                <div className="nav-sparkle-logo--animation" />
              </div>
              {leftSlot}
            </div>

            {user ? (
              <div className="navbar-links">
                {rightSlot}
                <NavBarProfile />
              </div>
            ) : (
              <NavBarLogin />
            )}
          </div>
        </div>
      </header>

      {/* @debt Remove back button from Navbar */}
      {venue?.parentId && parentVenue?.name && (
        <div className="back-map-btn" onClick={backToParentVenue}>
          <div className="back-icon" />
          <span className="back-link">
            Back{parentVenue ? ` to ${parentVenue.name}` : ""}
          </span>
        </div>
      )}
    </>
  );
};

export default NavBar;
