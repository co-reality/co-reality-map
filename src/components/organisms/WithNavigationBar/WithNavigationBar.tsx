import React from "react";

import { RelatedVenuesProvider } from "hooks/useRelatedVenues";

import { NavBar } from "components/molecules/NavBar";
import { Footer } from "components/molecules/Footer";

import "./WithNavigationBar.scss";

export interface WithNavigationBarProps {
  venueId?: string;
  redirectionUrl?: string;
  fullscreen?: boolean;
  hasBackButton?: boolean;
}

export const WithNavigationBar: React.FC<WithNavigationBarProps> = ({
  venueId,
  redirectionUrl,
  fullscreen,
  hasBackButton,
  children,
}) => {
  // @debt remove backButton from Navbar
  return (
    <>
      {/* @debt ideally we would have a better 'higher level' location we could include this provider that covers
       *    all of the admin components that currently directly render WithNavigationBar. We should refactor them
       *    all to have a standard 'admin wrapper frame' in a similar way to how src/pages/VenuePage/TemplateWrapper.tsx
       *    works on the user side of things.
       */}
      <RelatedVenuesProvider venueId={venueId}>
        <NavBar
          venueId={venueId}
          redirectionUrl={redirectionUrl}
          hasBackButton={hasBackButton}
        />
      </RelatedVenuesProvider>

      <div className={`navbar-margin ${fullscreen ? "fullscreen" : ""}`}>
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
