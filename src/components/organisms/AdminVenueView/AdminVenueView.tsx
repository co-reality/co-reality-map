import React, { useCallback, useMemo, useState } from "react";
import { Nav } from "react-bootstrap";
import classNames from "classnames";

import { useVenueId } from "hooks/useVenueId";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";
import { useUser } from "hooks/useUser";
import { useIsAdminUser } from "hooks/roles";

import { LoadingPage } from "components/molecules/LoadingPage";
import { Timing } from "./components/Timing";

import "./AdminVenueView.scss";

export enum AdminVenueTab {
  spaces = "spaces",
  timing = "timing",
  run = "run",
}

const adminVenueTabLabelMap: Readonly<Record<AdminVenueTab, String>> = {
  [AdminVenueTab.spaces]: "Spaces",
  [AdminVenueTab.timing]: "Timing",
  [AdminVenueTab.run]: "Run",
};

const DEFAULT_TAB = AdminVenueTab.spaces;

export const AdminVenueView: React.FC = () => {
  const venueId = useVenueId();
  const [selectedTab, setSelectedTab] = useState<AdminVenueTab>(DEFAULT_TAB);

  const { userId } = useUser();
  const { isAdminUser } = useIsAdminUser(userId);

  // Get and pass venue to child components when working on tabs
  const { currentVenue, isCurrentVenueLoaded } = useConnectCurrentVenueNG(
    venueId
  );

  const renderAdminVenueTabs = useMemo(() => {
    return Object.entries(adminVenueTabLabelMap).map(([key, text]) => (
      <Nav.Link
        key={key}
        className={classNames("AdminVenueView__tab", {
          "AdminVenueView__tab--selected": selectedTab === key,
        })}
        eventKey={key}
      >
        {text}
      </Nav.Link>
    ));
  }, [selectedTab]);

  const selectTab = useCallback((tab: string) => {
    setSelectedTab(tab as AdminVenueTab);
  }, []);

  if (!isCurrentVenueLoaded) {
    return <LoadingPage />;
  }

  if (!isAdminUser) {
    return <>Forbidden</>;
  }

  return (
    <>
      <div className="AdminVenueView">
        <Nav
          className="AdminVenueView__options"
          activeKey={selectedTab}
          onSelect={selectTab}
        >
          {renderAdminVenueTabs}
        </Nav>
      </div>
      {selectedTab === AdminVenueTab.spaces && <div>Spaces</div>}
      {selectedTab === AdminVenueTab.timing && (
        <Timing
          venue={currentVenue}
          onClickNext={() => setSelectedTab(AdminVenueTab.run)}
          onClickBack={() => setSelectedTab(AdminVenueTab.spaces)}
        />
      )}
      {selectedTab === AdminVenueTab.run && <div>Run</div>}
    </>
  );
};
