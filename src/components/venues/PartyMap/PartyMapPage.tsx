import React from "react";
import { useSelector } from "react-redux";
import { User as FUser } from "firebase";

import CountDown from "components/molecules/CountDown";
import UserList from "components/molecules/UserList";
import Chatbox from "components/organisms/Chatbox";
import RoomList from "./components/RoomList";
import WithNavigationBar from "components/organisms/WithNavigationBar";
import useProfileInformationCheck from "hooks/useProfileInformationCheck";
import { User } from "types/User";
import useUpdateLocationEffect from "utils/useLocationUpdateEffect";

import { Map, PartyTitle } from "./components";
import { PartyMapData } from "./types";

export interface PartyMapVenue {
  template: string;
  data: PartyMapData;
}

const PartyMap = () => {
  const { partygoers, user, venue } = useSelector((state: any) => ({
    venue: state.firestore.data.currentVenue,
    user: state.user,
    partygoers: state.firestore.ordered.partygoers,
  })) as { partygoers: User[]; user: FUser; venue: PartyMapVenue };

  useProfileInformationCheck();
  useUpdateLocationEffect(user, "Map");

  const attendances = partygoers
    ? partygoers.reduce((acc: { [key: string]: number }, value) => {
        acc[value.lastSeenIn] = (acc[value.lastSeenIn] || 0) + 1;
        return acc;
      }, {})
    : [];

  return (
    <WithNavigationBar>
      <div className="container">
        <div className="small-right-margin">
          <PartyTitle
            startUtcSeconds={venue.data.start_utc_seconds}
            withCountDown={false}
          />
        </div>
        {partygoers && (
          <div className="col">
            <UserList users={partygoers} imageSize={50} />
          </div>
        )}
        <div className="col">
          <div className="starting-indication">
            {venue.data.description.text}{" "}
            {venue.data.description.program_url && (
              <a
                href={venue.data.description.program_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Event Program here
              </a>
            )}
          </div>
          <CountDown startUtcSeconds={venue.data.start_utc_seconds} />
        </div>
        <div className="row">
          <Map config={venue.data} attendances={attendances} />
        </div>
        <div className="row">
          <div className="col">
            <RoomList
              startUtcSeconds={venue.data.start_utc_seconds}
              rooms={venue.data.rooms}
              attendances={attendances}
            />
          </div>
          <div className="col-5 chat-wrapper">
            <Chatbox />
          </div>
        </div>
      </div>
    </WithNavigationBar>
  );
};

export default PartyMap;
