// @debt Remove, once the proper user fix is merged in
import { CacheActions, CacheActionTypes } from "store/actions/Cache";

import { UserWithLocation } from "types/User";

import { WithId } from "utils/id";

export type CacheState = {
  usersRecord: Record<string, WithId<UserWithLocation>>;
  usersArray: WithId<UserWithLocation>[];
};

const initialState: CacheState = {
  usersRecord: {},
  usersArray: [],
};

export const cacheReducer = (
  state = initialState,
  action: CacheActions
): CacheState => {
  switch (action.type) {
    case CacheActionTypes.RELOAD_USER_CACHE:
      return {
        ...state,
        usersArray: Object.values(action.payload.users),
        usersRecord: action.payload.users,
      };

    case CacheActionTypes.UPDATE_USER_CACHE:
      return {
        ...state,
        usersRecord: {
          ...state.usersRecord,
          [action.payload.id]: action.payload.user,
        },
        usersArray: state.usersArray.map((u) => {
          if (u.id !== action.payload.id) return u;
          return action.payload.user;
        }),
      };
    default:
      return state;
  }
};
