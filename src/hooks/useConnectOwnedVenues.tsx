import React, { createContext, useContext, useMemo, useCallback } from "react";

import { SparkleSelector } from "types/SparkleSelector";
import { ReactHook } from "types/utility";
import { AnyVenue } from "types/venues";

import { WithId, withId } from "utils/id";

import { useFirestoreConnect, isLoaded } from "hooks/useFirestoreConnect";
import { useSelector } from "hooks/useSelector";

export const ownedVenuesSelector: SparkleSelector<
  Record<string, AnyVenue> | undefined
> = (state) => state.firestore.data.ownedVenues;

export const useConnectOwnedVenues = (userId?: string) => {
  useFirestoreConnect(
    userId
      ? {
          collection: "venues",
          where: [["owners", "array-contains", userId]],
          storeAs: "ownedVenues",
        }
      : undefined
  );
};

export interface OwnedVenuesContextState {
  isLoaded: boolean;
  isLoading: boolean;

  ownedVenues: WithId<AnyVenue>[];
  ownedVenuesIds: string[];

  findVenueInOwnedVenues: (
    searchedForVenueId: string
  ) => WithId<AnyVenue> | undefined;
}

const OwnedVenuesContext = createContext<OwnedVenuesContextState | undefined>(
  undefined
);

export interface OwnedVenuesProviderProps {
  userId?: string;
}

export const OwnedVenuesProvider: React.FC<OwnedVenuesProviderProps> = ({
  children,
  userId,
}) => {
  useConnectOwnedVenues(userId);

  const venues = useSelector(ownedVenuesSelector);

  const ownedVenues = useMemo(
    () => Object.entries(venues ?? {}).map(([id, venue]) => withId(venue, id)),
    [venues]
  );

  const ownedVenuesIds = useMemo(() => Object.keys(venues ?? {}), [venues]);

  const findVenueInOwnedVenues = useCallback(
    (searchedForVenueId: string): WithId<AnyVenue> | undefined =>
      ownedVenues.find((venue) => venue.id === searchedForVenueId),
    [ownedVenues]
  );

  const ownedVenuesState: OwnedVenuesContextState = useMemo(
    () => ({
      isLoaded: isLoaded(venues),
      isLoading: !isLoaded(venues),

      ownedVenues,
      ownedVenuesIds,

      findVenueInOwnedVenues,
    }),
    [venues, ownedVenues, ownedVenuesIds, findVenueInOwnedVenues]
  );

  return (
    <OwnedVenuesContext.Provider value={ownedVenuesState}>
      {children}
    </OwnedVenuesContext.Provider>
  );
};

export const useOwnedVenuesContext = (): OwnedVenuesContextState => {
  const ownedVenuesState = useContext(OwnedVenuesContext);

  if (!ownedVenuesState) {
    throw new Error(
      "<OwnedVenuesProvider/> not found. Did you forget to include it in your component hierarchy?"
    );
  }

  return ownedVenuesState;
};

export interface AdministeredProps extends OwnedVenuesProviderProps {
  currentVenueId?: string;
}

export interface AdministeredData extends OwnedVenuesContextState {
  currentVenue?: WithId<AnyVenue>;
}

export const useOwnedVenues: ReactHook<AdministeredProps, AdministeredData> = ({
  currentVenueId,
}): AdministeredData => {
  const ownedVenuesState = useOwnedVenuesContext();

  const { findVenueInOwnedVenues } = ownedVenuesState;

  const currentVenue: WithId<AnyVenue> | undefined = useMemo(
    () => (currentVenueId ? findVenueInOwnedVenues(currentVenueId) : undefined),
    [currentVenueId, findVenueInOwnedVenues]
  );

  return {
    ...ownedVenuesState,
    currentVenue,
  };
};
