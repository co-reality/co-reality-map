import React from "react";

import { useVenueId } from "hooks/useVenueId";
import {
  OwnedVenuesProvider,
  OwnedVenuesProviderProps,
} from "hooks/useConnectOwnedVenues";
import { WorldUsersProvider, WorldUsersProviderProps } from "hooks/users";
import {
  RelatedVenuesProvider,
  RelatedVenuesProviderProps,
} from "hooks/useRelatedVenues";
import { useUser } from "hooks/useUser";

export type EmptyProviderProps = Partial<
  OwnedVenuesProviderProps &
    RelatedVenuesProviderProps &
    WorldUsersProviderProps
>;

const EmptyProvider: React.FC<EmptyProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export interface ProvidedProps {
  withOwnedVenues?: boolean;
  withRelatedVenues?: boolean;
  withWorldUsers?: boolean;
}

export const Provided: React.FC<ProvidedProps> = ({
  children,
  withOwnedVenues = false,
  withRelatedVenues = false,
  withWorldUsers = false,
}) => {
  const { userId } = useUser();
  const venueId = useVenueId();

  const MaybeOwnedVenuesProvider: React.FC<OwnedVenuesProviderProps> = withOwnedVenues
    ? OwnedVenuesProvider
    : EmptyProvider;

  const MaybeRelatedVenuesProvider: React.FC<RelatedVenuesProviderProps> = withRelatedVenues
    ? RelatedVenuesProvider
    : EmptyProvider;

  const MaybeWorldUsersProvider: React.FC<WorldUsersProviderProps> = withWorldUsers
    ? WorldUsersProvider
    : EmptyProvider;

  return (
    <MaybeWorldUsersProvider venueId={venueId}>
      <MaybeRelatedVenuesProvider venueId={venueId}>
        <MaybeOwnedVenuesProvider userId={userId}>
          {children}
        </MaybeOwnedVenuesProvider>
      </MaybeRelatedVenuesProvider>
    </MaybeWorldUsersProvider>
  );
};
