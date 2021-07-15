import {
  SovereignVenueActions,
  SovereignVenueActionTypes,
} from "store/actions/SovereignVenue";

import { AnyVenue } from "types/venues";

import { WithId } from "utils/id";

export type SovereignVenueState = {
  sovereignVenue?: WithId<AnyVenue>;
  errorMsg?: string;
  isLoading: boolean;
};

const initialSovereignVenueState: SovereignVenueState = {
  isLoading: false,
};

export const sovereignVenueReducer = (
  state = initialSovereignVenueState,
  action: SovereignVenueActions
): SovereignVenueState => {
  switch (action.type) {
    case SovereignVenueActionTypes.SET_SOVEREIGN_VENUE:
      return {
        ...state,
        sovereignVenue: action.payload.sovereignVenue,
        isLoading: false,
        errorMsg: undefined,
      };
    case SovereignVenueActionTypes.SET_SOVEREIGN_VENUE_IS_LOADING:
      return { ...state, isLoading: action.payload.isLoading };
    case SovereignVenueActionTypes.SET_SOVEREIGN_VENUE_ERROR:
      return {
        ...state,
        errorMsg: action.payload.errorMsg,
        isLoading: false,
        sovereignVenue: undefined,
      };
    case SovereignVenueActionTypes.RESET_SOVEREIGN_VENUE:
      return {
        ...state,
        sovereignVenue: undefined,
        isLoading: false,
        errorMsg: undefined,
      };
    default:
      return state;
  }
};
