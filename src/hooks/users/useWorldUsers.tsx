import React, { createContext, useContext, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";

import { User } from "types/User";

import {
  useWorldUsersQuery,
  useWorldUsersQueryState,
  WorldUsersApiArgs,
} from "store/api/worldUsers";

import { WithId } from "utils/id";

import { useSovereignVenue } from "hooks/useSovereignVenue";

export interface WorldUsersContextState {
  isSovereignVenueIdLoading: boolean;
  sovereignVenueId?: string;
  sovereignVenueIdError?: string;

  worldUsersApiArgs?: WorldUsersApiArgs;
}

const WorldUsersContext = createContext<WorldUsersContextState | undefined>(
  undefined
);

export interface WorldUsersProviderProps {
  venueId?: string;
}

export const WorldUsersProvider: React.FC<WorldUsersProviderProps> = ({
  venueId,
  children,
}) => {
  const {
    sovereignVenueId,
    isSovereignVenueLoading,
    errorMsg: sovereignVenueIdError,
  } = useSovereignVenue({
    venueId,
  });

  const relatedLocationIds: string[] | undefined = useMemo(() => {
    if (isSovereignVenueLoading || !venueId || !sovereignVenueId) return;

    return [sovereignVenueId, venueId];
  }, [isSovereignVenueLoading, sovereignVenueId, venueId]);

  // TODO: should we refactor this to use useWorldUsersQuerySubscription rather than connecting it to receive data updates?
  //   It seems that useWorldUsersQuerySubscription doesn't return originalArgs, so we can't use it in the same way
  //   as we are currently doing things.. but we could potentially just pass the same args object into the hook as what we pass
  //   down for the descendant code to use.. which would work around that 'limitation'
  // TODO: https://redux-toolkit.js.org/rtk-query/usage/queries#selecting-data-from-a-query-result
  const { originalArgs: worldUsersApiArgs } = useWorldUsersQuery(
    relatedLocationIds ? { relatedLocationIds } : skipToken,
    {
      selectFromResult: ({ originalArgs }) => ({ originalArgs }),
    }
  );

  const worldUsersState: WorldUsersContextState = useMemo(
    () => ({
      venueId,
      isSovereignVenueIdLoading: isSovereignVenueLoading,
      sovereignVenueId,
      sovereignVenueIdError,
      worldUsersApiArgs,
    }),
    [
      venueId,
      isSovereignVenueLoading,
      sovereignVenueId,
      sovereignVenueIdError,
      worldUsersApiArgs,
    ]
  );

  return (
    <WorldUsersContext.Provider value={worldUsersState}>
      {children}
    </WorldUsersContext.Provider>
  );
};

export const useWorldUsersContext = (): WorldUsersContextState => {
  const worldUsersState = useContext(WorldUsersContext);

  if (!worldUsersState) {
    throw new Error(
      "<WorldUsersProvider/> not found. Did you forget to include it in your component hierarchy?"
    );
  }

  return worldUsersState;
};

export interface WorldUsersData {
  isWorldUsersLoaded: boolean;
  worldUsers: readonly WithId<User>[];
}

// TODO:
//   https://redux-toolkit.js.org/rtk-query/api/created-api/overview#react-hooks
//   https://redux-toolkit.js.org/rtk-query/api/created-api/hooks
//   https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#usequerystate
export const useWorldUsers = (): WorldUsersData => {
  // We mostly use this here to ensure that the WorldUsersProvider has definitely been connected
  const { worldUsersApiArgs } = useWorldUsersContext();

  const { isSuccess: isWorldUsersLoaded, worldUsers } = useWorldUsersQueryState(
    worldUsersApiArgs ?? skipToken,
    {
      selectFromResult: (result) => ({
        isSuccess: result.isSuccess,
        worldUsers: result.data?.worldUsers ?? [],
      }),
    }
  );

  return {
    isWorldUsersLoaded,
    worldUsers,
  };
};
