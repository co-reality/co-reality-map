import { skipToken } from "@reduxjs/toolkit/dist/query/react";

import { useWorldUsersQueryState } from "store/api/worldUsers";

import { UserLocation } from "types/User";

import { WithId } from "utils/id";

import { useWorldUsersContext } from "./useWorldUsers";

export interface WorldUserLocationData {
  isUserLocationLoaded: boolean;
  userLocation?: WithId<UserLocation>;
}

export const useWorldUserLocation = (
  userId?: string
): WorldUserLocationData => {
  // We mostly use this here to ensure that the WorldUsersProvider has definitely been connected
  const { worldUsersApiArgs } = useWorldUsersContext();

  const {
    isSuccess: isUserLocationLoaded,
    userLocation,
  } = useWorldUsersQueryState(worldUsersApiArgs ?? skipToken, {
    selectFromResult: (result) => ({
      isSuccess: result.isSuccess,
      userLocation: userId
        ? result.data?.worldUserLocationsById?.[userId]
        : undefined,
    }),
  });

  return {
    isUserLocationLoaded,
    userLocation,
  };
};
