// @debt Remove, once the proper user fix is merged in
import { ReduxAction } from "types/redux";
import { UserWithLocation } from "types/User";

import { WithId } from "utils/id";

export enum CacheActionTypes {
  RELOAD_USER_CACHE = "RELOAD_USER_CACHE",
  UPDATE_USER_CACHE = "UPDATE_USER_CACHE",
}

type ReloadUserCacheAction = ReduxAction<
  CacheActionTypes.RELOAD_USER_CACHE,
  { users: Record<string, WithId<UserWithLocation>> }
>;

type UpdateUserCacheAction = ReduxAction<
  CacheActionTypes.UPDATE_USER_CACHE,
  {
    id: string;
    user: WithId<UserWithLocation>;
  }
>;

export const reloadUserCache = (
  users: Record<string, WithId<UserWithLocation>>
): ReloadUserCacheAction => ({
  type: CacheActionTypes.RELOAD_USER_CACHE,
  payload: { users },
});

export const updateUserCache = (
  id: string,
  user: WithId<UserWithLocation>
): UpdateUserCacheAction => ({
  type: CacheActionTypes.UPDATE_USER_CACHE,
  payload: { id, user },
});

export type CacheActions = UpdateUserCacheAction | ReloadUserCacheAction;
