import { matchPath, useHistory } from "react-router-dom";

type VenueRoute = {
  venueId: string;
};

// Sometimes in a nested route we want venue ID
export const useVenueId: () => string | undefined = () => {
  const history = useHistory();
  let match = matchPath<VenueRoute>(history.location.pathname, {
    path: "/e/:step/:venueId",
  });

  if (match && match.params.venueId) {
    return match.params.venueId;
  }

  match = matchPath<VenueRoute>(history.location.pathname, {
    path: "/in/:venueId",
  });

  if (match && match.params.venueId) {
    return match.params.venueId;
  }

  match = matchPath(history.location.pathname, {
    path: "/v/:venueId",
  });

  return match?.params?.venueId;
};
