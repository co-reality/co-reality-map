import { useMemo } from "react";

import { User } from "types/User";

import { WithId } from "utils/id";
import { normalizeTimestampToMilliseconds } from "utils/time";

import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";
import { useUserLastSeenThreshold } from "hooks/useUserLastSeenThreshold";
import { useVenueId } from "hooks/useVenueId";

import { useWorldUsers } from "./useWorldUsers";

export { useConnectWorldUsers } from "./useConnectWorldUsers";
export { useWorldUsers } from "./useWorldUsers";
export {
  useWorldUsersById,
  useWorldUsersByIdWorkaround,
} from "./useWorldUsersById";

export const useRecentWorldUsers = (): {
  recentWorldUsers: readonly WithId<User>[];
  isRecentWorldUsersLoaded: boolean;
} => {
  const lastSeenThreshold = useUserLastSeenThreshold();

  const { worldUsers, isWorldUsersLoaded } = useWorldUsers();

  return useMemo(
    () => ({
      recentWorldUsers: worldUsers.filter(
        (user) =>
          normalizeTimestampToMilliseconds(user.lastSeenAt) > lastSeenThreshold
      ),
      isRecentWorldUsersLoaded: isWorldUsersLoaded,
    }),
    [worldUsers, isWorldUsersLoaded, lastSeenThreshold]
  );
};

/**
 * @description this hook's filtering world users based on their @lastSeenIn location
 *
 * @param locationName is a key for `lastSeenIn` firestore field in user's object
 *
 * @example useRecentLocationUsers(venue.name)
 * @example useRecentLocationUsers(`${venue.name}/${roomTitle}`)
 */
export const useRecentLocationUsers = (locationName?: string) => {
  const lastSeenThreshold = useUserLastSeenThreshold();
  const { worldUsers, isWorldUsersLoaded } = useWorldUsers();

  return useMemo(
    () => ({
      recentLocationUsers: locationName
        ? worldUsers.filter(
            (user) =>
              user.lastSeenIn?.[locationName] &&
              normalizeTimestampToMilliseconds(user.lastSeenIn[locationName]) >
                lastSeenThreshold
          )
        : [],
      isRecentLocationUsersLoaded: isWorldUsersLoaded,
    }),
    [worldUsers, isWorldUsersLoaded, lastSeenThreshold, locationName]
  );
};

export const useRecentVenueUsers = () => {
  const venueId = useVenueId();

  const { currentVenue } = useConnectCurrentVenueNG(venueId);

  const {
    recentLocationUsers,
    isRecentLocationUsersLoaded,
  } = useRecentLocationUsers(currentVenue?.name);

  return {
    recentVenueUsers: recentLocationUsers,
    isRecentVenueUsersLoaded: isRecentLocationUsersLoaded,
  };
};
