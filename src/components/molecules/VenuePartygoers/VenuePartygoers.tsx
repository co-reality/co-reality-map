import React, { useMemo } from "react";

import { useRecentWorldUsers } from "hooks/users";
import { useConnectRelatedVenues } from "hooks/useConnectRelatedVenues";
import { useVenueId } from "hooks/useVenueId";

import "./VenuePartygoers.scss";
// import { useRecentPartyUsers } from "hooks/users";

export const VenuePartygoers = () => {
  const venueId = useVenueId();
  const {
    parentVenue,
    currentVenue,
    isParentVenueLoaded,
    isCurrentVenueLoaded,
  } = useConnectRelatedVenues({ venueId });

  const { recentWorldUsers } = useRecentWorldUsers();

  const numberOfRecentWorldUsers = recentWorldUsers.length;

  const title = useMemo<string>(() => {
    if (!isParentVenueLoaded || isCurrentVenueLoaded) return "";

    const attendeesTitle =
      parentVenue?.attendeesTitle ??
      currentVenue?.attendeesTitle ??
      "partygoers";

    return `${numberOfRecentWorldUsers} ${attendeesTitle} online`;
  }, [
    isParentVenueLoaded,
    isCurrentVenueLoaded,
    parentVenue,
    currentVenue,
    numberOfRecentWorldUsers,
  ]);

  return <div className="venue-partygoers-container">{title}</div>;
};
