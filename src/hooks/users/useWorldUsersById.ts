import { useMemo } from "react";

import { User, RecentUserStatusType } from "types/User";

import { worldUsersByIdSelector } from "utils/selectors";
import { normalizeTimestampToMilliseconds } from "utils/time";

import { isLoaded } from "hooks/useFirestoreConnect";
import { useSelector } from "hooks/useSelector";
import { useUserLastSeenThreshold } from "hooks/useUserLastSeenThreshold";

import { useConnectWorldUsers } from "./useConnectWorldUsers";

/**
 * @debt typing, Record implies that a User will exist for literally any given string, which is untrue
 * @deprecated use useWorldUsersByIdWorkaround until we refactor this to fix the typing issue across the codebase
 */
export const useWorldUsersById = () => {
  useConnectWorldUsers();

  const worldUsersById = useSelector(worldUsersByIdSelector);

  return useMemo(
    () => ({
      worldUsersById: worldUsersById ?? {},
      isWorldUsersLoaded: isLoaded(worldUsersById),
    }),
    [worldUsersById]
  );
};

// @debt typing, this uses Partial<Record<K,T>> to work around the bug where Record implies that a User will exist for literally any given string, which is untrue
// @debt refactor all usages of Record<string, User> to Partial<Record<string, User>> (then we can remove this workaround)
export const useWorldUsersByIdWorkaround = () => {
  const {
    worldUsersById: _worldUsersById,
    isWorldUsersLoaded,
  } = useWorldUsersById();

  const worldUsersById: Partial<Record<string, User>> = _worldUsersById;

  return { worldUsersById, isWorldUsersLoaded };
};

export const useRecentWorldUser = (userId: string): { recentUser?: User } => {
  const { worldUsersById } = useWorldUsersByIdWorkaround();

  return { recentUser: worldUsersById[userId] };
};

export const useRecentUserStatus = (user?: User): RecentUserStatusType => {
  const lastSeenThreshold = useUserLastSeenThreshold();
  if (!user) return RecentUserStatusType.offline;

  if (user.status === RecentUserStatusType.busy)
    return RecentUserStatusType.busy;
  if (normalizeTimestampToMilliseconds(user.lastSeenAt) > lastSeenThreshold)
    return RecentUserStatusType.online;
  return RecentUserStatusType.offline;
};
