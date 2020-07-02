import React from "react";
import { useSelector } from "react-redux";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import JazzBar from "../Jazzbar";
import ReactionPage from "pages/ReactionPage";
import useConnectPartyGoers from "hooks/useConnectPartyGoers";
import ExperienceContextProvider from "components/context/ExperienceContext";
import { useFirestoreConnect } from "react-redux-firebase";
import { Venue } from "pages/VenuePage/VenuePage";

const JazzbarRouter: React.FunctionComponent = () => {
  const match = useRouteMatch();
  useConnectPartyGoers();
  useFirestoreConnect("users");

  const { venue } = useSelector((state: any) => ({
    venue: state.firestore.data.currentVenue,
  })) as { venue: Venue };

  return (
    <ExperienceContextProvider venueName={venue.name}>
      <Switch>
        <Route path={`${match.url}/band`} component={ReactionPage} />
        <Route path={`${match.url}/`} component={JazzBar} />
      </Switch>
    </ExperienceContextProvider>
  );
};

export default JazzbarRouter;
