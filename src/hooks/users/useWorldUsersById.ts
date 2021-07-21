import { skipToken } from "@reduxjs/toolkit/dist/query/react";

import { useWorldUsersQueryState } from "store/api/worldUsers";

import { User } from "types/User";

import { useWorldUsersContext } from "./useWorldUsers";

/**
 * @debt typing, Record implies that a User will exist for literally any given string, which is untrue
 * @deprecated use useWorldUsersByIdWorkaround until we refactor this to fix the typing issue across the codebase
 */
export const useWorldUsersById = () => {
  // We mostly use this here to ensure that the WorldUsersProvider has definitely been connected
  const { worldUsersApiArgs } = useWorldUsersContext();

  const {
    isSuccess: isWorldUsersByIdLoaded,
    worldUsersById,
  } = useWorldUsersQueryState(worldUsersApiArgs ?? skipToken, {
    selectFromResult: (result) => ({
      isSuccess: result.isSuccess,
      worldUsersById: result.data?.worldUsersById ?? {},
    }),
  });

  return {
    isWorldUsersLoaded: isWorldUsersByIdLoaded,
    worldUsersById,
  };
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
