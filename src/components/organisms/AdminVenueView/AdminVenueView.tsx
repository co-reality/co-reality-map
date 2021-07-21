import React, { useMemo } from "react";
import { useParams } from "react-router";
import { Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import classNames from "classnames";

import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";
import { useUser } from "hooks/useUser";
import { useIsAdminUser } from "hooks/roles";

import { adminNGVenueUrl } from "utils/url";

import { LoadingPage } from "components/molecules/LoadingPage";

import "./AdminVenueView.scss";

export enum AdminVenueTab {
  spaces = "spaces",
  timing = "timing",
  run = "run",
}

export interface AdminVenueViewRouteParams {
  venueId?: string;
  selectedTab?: AdminVenueTab;
}

const adminVenueTabLabelMap: Readonly<Record<AdminVenueTab, String>> = {
  [AdminVenueTab.spaces]: "Spaces",
  [AdminVenueTab.timing]: "Timing",
  [AdminVenueTab.run]: "Run",
};

export const AdminVenueView: React.FC = () => {
  const {
    venueId,
    selectedTab = AdminVenueTab.spaces,
  } = useParams<AdminVenueViewRouteParams>();

  const { userId } = useUser();
  const { isAdminUser } = useIsAdminUser(userId);

  // Get and pass venue to child components when working on tabs
  const { isCurrentVenueLoaded } = useConnectCurrentVenueNG(venueId);

  const renderAdminVenueTabs = useMemo(() => {
    return Object.entries(adminVenueTabLabelMap).map(([key, label]) => (
      <LinkContainer key={key} to={adminNGVenueUrl(venueId, key)}>
        <Nav.Link
          key={key}
          className={classNames("AdminVenueView__tab", {
            "AdminVenueView__tab--selected": selectedTab === key,
          })}
          eventKey={key}
          href={adminNGVenueUrl(venueId, key)}
        >
          {label}
        </Nav.Link>
      </LinkContainer>
    ));
  }, [selectedTab, venueId]);

  if (!isCurrentVenueLoaded) {
    return <LoadingPage />;
  }

  if (!isAdminUser) {
    return <>Forbidden</>;
  }

  return (
    <>
      <div className="AdminVenueView">
        <Nav className="AdminVenueView__options" activeKey={selectedTab}>
          {renderAdminVenueTabs}
        </Nav>
      </div>
      {selectedTab === AdminVenueTab.spaces && <div>Spaces</div>}
      {selectedTab === AdminVenueTab.timing && <div>Timing</div>}
      {selectedTab === AdminVenueTab.run && <div>Run</div>}
    </>
  );
};
