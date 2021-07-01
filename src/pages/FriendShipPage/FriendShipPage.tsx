import React, { useState } from "react";

import { useVenueId } from "hooks/useVenueId";
import { useSelector } from "hooks/useSelector";

import { currentVenueSelectorData } from "utils/selectors";

import Room from "components/organisms/Room";
import WithNavigationBar from "components/organisms/WithNavigationBar";
import TablesUserList from "components/molecules/TablesUserList";
import TableComponent from "components/molecules/TableComponent";
import TableHeader from "components/molecules/TableHeader";

import { FRIENDSHIP_CUSTOM_TABLES } from "./constants";

import "./FriendShipPage.scss";

export const FriendShipPage: React.FunctionComponent = () => {
  const [seatedAtTable, setSeatedAtTable] = useState("");
  const venue = useSelector(currentVenueSelectorData);
  const venueId = useVenueId();

  if (!venue) return <>Loading...</>;

  return (
    <WithNavigationBar venueId={venueId}>
      <div className="friendship-container">
        <div className="title">
          <h1>{venue.name}</h1>
        </div>
        <div className="content">
          {!seatedAtTable && (
            <div className="row">
              <div className="col bar-container">
                <div className="title">{venue.name}</div>
                <div className="subtitle">{venue.name}</div>
                <div className="wrapper">
                  <Room
                    venueName={venue.name}
                    roomName="friendship"
                    setUserList={() => null}
                  />
                </div>
              </div>
              <div className="col-4">{/* <ChatBox room="friendship" /> */}</div>
            </div>
          )}
        </div>
        <div className="row">
          <div
            className={`col ${
              seatedAtTable ? "table-container" : "table-grid"
            }`}
          >
            <TablesUserList
              venueName={venue.name}
              setSeatedAtTable={setSeatedAtTable}
              seatedAtTable={seatedAtTable}
              TableComponent={TableComponent}
              customTables={FRIENDSHIP_CUSTOM_TABLES}
              leaveText="Return to Isle of Friends"
              joinMessage={true}
            />
            {seatedAtTable && (
              <div className="col wrapper">
                <TableHeader
                  seatedAtTable={seatedAtTable}
                  setSeatedAtTable={setSeatedAtTable}
                  venueName={venue.name}
                  tables={FRIENDSHIP_CUSTOM_TABLES}
                />
                <Room
                  venueName={venue.name}
                  roomName={seatedAtTable}
                  setUserList={() => null}
                />
              </div>
            )}
          </div>
        </div>
        {seatedAtTable && (
          <div className="centered-row">
            <div className="col-6">{/* <ChatBox room="friendship" /> */}</div>
          </div>
        )}
      </div>
    </WithNavigationBar>
  );
};

/**
 * @deprecated use named export instead
 */
export default FriendShipPage;
