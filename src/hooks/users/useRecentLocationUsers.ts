import { skipToken } from "@reduxjs/toolkit/dist/query/react";

import { useWorldUsersQueryState } from "store/api";

import { User, UserLocation } from "types/User";

import { WithId } from "utils/id";
import { normalizeTimestampToMilliseconds } from "utils/time";

import { useUserLastSeenThreshold } from "hooks/useUserLastSeenThreshold";

import { useWorldUsersContext } from "./useWorldUsers";

export interface RecentLocationUsersData {
  isRecentLocationUsersLoaded: boolean;
  recentLocationUsers: readonly WithId<User>[];
}

/**
 * @description this hook's filtering world users based on their @lastSeenIn location
 *
 * @param locationName is a key for `lastSeenIn` firestore field in user's object
 *
 * @example useRecentLocationUsers(venue.name)
 * @example useRecentLocationUsers(`${venue.name}/${roomTitle}`)
 *
 * @debt the only difference between this and useRecentWorldUsers is that useRecentWorldUsers checks
 *   userLocation.lastSeenAt, whereas useRecentLocationUsers checks userLocation.lastSeenIn[locationName]
 *   Can we cleanly refactor them into a single hook somehow to de-duplicate the logic?
 */
export const useRecentLocationUsers = (
  locationName?: string
): RecentLocationUsersData => {
  const lastSeenThreshold = useUserLastSeenThreshold();

  // We mostly use this here to ensure that the WorldUsersProvider has definitely been connected
  const { worldUsersApiArgs } = useWorldUsersContext();

  const {
    isSuccess: isRecentLocationUsersLoaded,
    recentLocationUsers,
  } = useWorldUsersQueryState(worldUsersApiArgs ?? skipToken, {
    selectFromResult: ({
      isSuccess,
      data: { worldUsers, worldUserLocationsById } = {},
    }) => {
      if (!worldUsers || !worldUserLocationsById || !locationName)
        return { isSuccess, recentLocationUsers: [] };

      const recentLocationUsers = worldUsers.filter((user) => {
        const userLocation: WithId<UserLocation> | undefined =
          worldUserLocationsById[user.id];

        return (
          userLocation.lastSeenIn?.[locationName] &&
          normalizeTimestampToMilliseconds(
            userLocation.lastSeenIn[locationName]
          ) > lastSeenThreshold
        );
      });

      return {
        isSuccess,
        recentLocationUsers,
      };
    },
  });

  return {
    isRecentLocationUsersLoaded,
    recentLocationUsers,
  };
};
