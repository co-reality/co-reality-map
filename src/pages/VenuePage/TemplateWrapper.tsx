import React, { Suspense, lazy } from "react";
import { Route, Switch, useHistory, useRouteMatch } from "react-router-dom";

import { AnyVenue, VenueTemplate } from "types/venues";

import { WithId } from "utils/id";
import { tracePromise } from "utils/performance";

import { ReactionsProvider } from "hooks/reactions";
import { WorldUsersProvider } from "hooks/users";
import { RelatedVenuesProvider } from "hooks/useRelatedVenues";

import { FriendShipPage } from "pages/FriendShipPage";

import { ArtPiece } from "components/templates/ArtPiece";
import { Audience } from "components/templates/Audience/Audience";
import { Auditorium } from "components/templates/Auditorium";
import { ConversationSpace } from "components/templates/ConversationSpace";
import { Embeddable } from "components/templates/Embeddable";
import { FireBarrel } from "components/templates/FireBarrel";
import { Jazzbar } from "components/templates/Jazzbar";
import { PartyMap } from "components/templates/PartyMap";
import { PosterHall } from "components/templates/PosterHall";
import { PosterPage } from "components/templates/PosterPage";
import { ScreeningRoom } from "components/templates/ScreeningRoom";
import { ReactionPage } from "components/templates/ReactionPage";

import { ChatSidebar } from "components/organisms/ChatSidebar";
import { UserProfileModal } from "components/organisms/UserProfileModal";
import { WithNavigationBar } from "components/organisms/WithNavigationBar";

import { AnnouncementMessage } from "components/molecules/AnnouncementMessage";
import { LoadingPage } from "components/molecules/LoadingPage";

const PlayaRouter = lazy(() =>
  tracePromise("TemplateWrapper::lazy-import::PlayaRouter", () =>
    import("components/templates/Playa/Router").then(({ PlayaRouter }) => ({
      default: PlayaRouter,
    }))
  )
);

export interface TemplateWrapperProps {
  venue: WithId<AnyVenue>;
}

export const TemplateWrapper: React.FC<TemplateWrapperProps> = ({ venue }) => {
  const history = useHistory();
  const match = useRouteMatch();

  // const { isShown, show, hide } = useShowHide();

  let template;
  // @debt remove backButton from Navbar
  let hasBackButton = true;
  switch (venue.template) {
    case VenueTemplate.jazzbar:
      template = (
        <Switch>
          <Route path={`${match.path}/reactions`} component={ReactionPage} />
          <Route render={() => <Jazzbar venue={venue} />} />
        </Switch>
      );
      // NOTE: Remove the back button, because we don't need it in Table view
      hasBackButton = false;
      break;

    case VenueTemplate.friendship:
      template = <FriendShipPage />;
      break;

    case VenueTemplate.partymap:
    case VenueTemplate.themecamp:
      template = <PartyMap venue={venue} />;
      break;

    case VenueTemplate.artpiece:
      template = <ArtPiece venue={venue} />;
      break;

    case VenueTemplate.playa:
    case VenueTemplate.preplaya:
      template = <PlayaRouter />;
      break;

    case VenueTemplate.zoomroom:
    case VenueTemplate.performancevenue:
    case VenueTemplate.artcar:
      if (venue.zoomUrl) {
        window.location.replace(venue.zoomUrl);

        // Note that we are explicitly returning here so that none of the rest of this component has a chance to render
        return <LoadingPage />;
      } else {
        template = (
          <p>
            Venue {venue.name} should redirect to a URL, but none was set.
            <br />
            <button
              role="link"
              className="btn btn-primary"
              onClick={() => history.goBack()}
            >
              Go Back
            </button>
          </p>
        );
      }
      break;

    // Note: This is the template that is used for Auditorium (v1)
    case VenueTemplate.audience:
      template = (
        <Switch>
          <Route path={`${match.path}/reactions`} component={ReactionPage} />
          <Route>
            <Audience venue={venue} />
          </Route>
        </Switch>
      );
      break;

    case VenueTemplate.auditorium:
      template = <Auditorium venue={venue} />;
      // NOTE: Remove the back button, because we need to implement it differently in Section
      hasBackButton = false;
      break;

    case VenueTemplate.conversationspace:
      template = <ConversationSpace venue={venue} />;
      // Remove the back button, because we don't need it in Table view
      hasBackButton = false;
      break;

    case VenueTemplate.embeddable:
      template = <Embeddable venue={venue} />;
      break;

    case VenueTemplate.firebarrel:
      template = <FireBarrel />;
      break;

    case VenueTemplate.posterhall:
      template = <PosterHall venue={venue} />;
      break;

    case VenueTemplate.posterpage:
      template = <PosterPage venue={venue} />;
      break;

    case VenueTemplate.screeningroom:
      template = <ScreeningRoom venue={venue} />;
      break;

    case VenueTemplate.avatargrid:
      template = (
        <div>
          Legacy Template: ${venue.template} has been removed from the platform
        </div>
      );
      break;

    default:
      // Technically TypeScript should prevent us missing a case here, but just in case, we work around it with an explicit cast to be able to render this
      template = <div>Unknown Template: ${(venue as AnyVenue).template}</div>;
  }

  // @debt remove backButton from Navbar
  return (
    <WorldUsersProvider venueId={venue.id}>
      <RelatedVenuesProvider venueId={venue.id}>
        <ReactionsProvider venueId={venue.id}>
          <WithNavigationBar hasBackButton={hasBackButton}>
            <AnnouncementMessage banner={venue.banner} />

            <Suspense fallback={<LoadingPage />}>{template}</Suspense>

            <ChatSidebar venue={venue} />
            <UserProfileModal venue={venue} />
          </WithNavigationBar>
        </ReactionsProvider>
      </RelatedVenuesProvider>
    </WorldUsersProvider>
  );
};
