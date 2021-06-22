import { FirebaseReducer } from "react-redux-firebase";

import { RootState } from "index";

import { ChatSettings, PrivateChatMessage, VenueChatMessage } from "types/chat";
import { Experience } from "types/Firestore";
import { Purchase } from "types/Purchase";
import { Reaction, TextReaction, TextReactionType } from "types/reactions";
import { SparkleSelector } from "types/SparkleSelector";
import { User } from "types/User";
import { AnyVenue, PosterPageVenue, VenueEvent } from "types/venues";
import { ScreeningRoomVideo } from "types/screeningRoom";

import { SovereignVenueState } from "store/reducers/SovereignVenue";

import { WithId } from "utils/id";

import {
  makeIsRequestedSelector,
  makeIsRequestingSelector,
  makeOrderedSelector,
} from "./firestoreSelectors";
import {
  AnimateMapStageOptions,
  AnimateMapWorldBounds,
  ReplicatedUser,
  ReplicatedVenue,
} from "../store/reducers/AnimateMap";
import { QuadTree } from "js-quadtree";

/**
 * Selector to retrieve Firebase auth from Redux.
 *
 * @param state the Redux store
 */
export const authSelector: SparkleSelector<FirebaseReducer.AuthState> = (
  state
) => state.firebase.auth;

/**
 * Selector to retrieve Firebase profile from Redux.
 *
 * @param state the Redux store
 */
export const profileSelector: SparkleSelector<FirebaseReducer.Profile<User>> = (
  state
) => state.firebase.profile;

/**
 * Selector to retrieve currentVenue?.[0] from the Redux Firestore.
 *
 * @param state the Redux store
 */
export const currentVenueSelector: SparkleSelector<
  WithId<AnyVenue> | undefined
> = (state) => state.firestore.ordered.currentVenue?.[0];

// @debt can we merge this with currentVenueSelector and just use 1 canonical version?
export const currentVenueSelectorData: SparkleSelector<AnyVenue | undefined> = (
  state
) => state.firestore.data.currentVenue;

/**
 * Selector to retrieve array of world-related users from the Redux Firestore.
 *
 * @param state the Redux store
 */
export const worldUsersSelector: SparkleSelector<WithId<User>[] | undefined> = (
  state
) => state.firestore.ordered.worldUsers;

/**
 * Selector to retrieve an object with world-related users from the Redux Firestore.
 *
 * @param state the Redux store
 */
export const worldUsersByIdSelector: SparkleSelector<
  Record<string, User> | undefined
> = (state) => state.firestore.data.worldUsers;

/**
 * Selector to retrieve venues from the Redux Firestore.
 *
 * @param state the Redux store
 *
 * @deprecated This selector requires all of the venues data in firebase to be loaded into memory. Find a different way.
 * @debt Refactor all places that rely on this, then remove it from the codebase
 */
export const venuesSelector: SparkleSelector<Record<string, AnyVenue>> = (
  state
) => state.firestore.data.venues || {};

/**
 * @deprecated This selector requires all of the venues data in firebase to be loaded into memory. Find a different way.
 * @debt Refactor all places that rely on this, then remove it from the codebase
 */
export const orderedVenuesSelector: SparkleSelector<
  WithId<AnyVenue>[] | undefined
> = (state) => state.firestore.ordered.venues;

/**
 * Makes a venueSelector selector for a given venueId, which when called
 * will retrieve the specified venue from the Redux Firestore.
 *
 * @param venueId the venueId to be retrieved
 * @return (state: RootState) => WithId<AnyVenue> | undefined
 *
 * @example
 *   const venueId = 'abc123'
 *   const venueSelector = useCallback(makeVenueSelector(venueId), [venueId])
 *   const venue = useSelector(venueSelector, shallowEqual)
 *
 * @deprecated This function relies on a selector that requires all of the venues data in firebase to be loaded into memory. Find a different way.
 * @debt Refactor all places that rely on this, then remove it from the codebase
 */
export const makeVenueSelector = (venueId: string) => (
  state: RootState
): WithId<AnyVenue> | undefined => {
  const venues = venuesSelector(state);

  if (!venues.hasOwnProperty(venueId)) return undefined;

  return { ...venues[venueId], id: venueId };
};

export const currentEventSelector: SparkleSelector<
  WithId<VenueEvent>[] | undefined
> = makeOrderedSelector("currentEvent");

export const userPurchaseHistorySelector: SparkleSelector<
  WithId<Purchase>[] | undefined
> = makeOrderedSelector("userPurchaseHistory");

export const shouldRetainAttendanceSelector: SparkleSelector<boolean> = (
  state
) => state.attendance.retainAttendance;

export const isCurrentVenueNGRequestedSelector: SparkleSelector<boolean> = makeIsRequestedSelector(
  "currentVenueNG"
);

export const isCurrentVenueNGRequestingSelector: SparkleSelector<boolean> = makeIsRequestingSelector(
  "currentVenueNG"
);

export const isCurrentVenueRequestedSelector: SparkleSelector<boolean> = makeIsRequestedSelector(
  "currentVenue"
);

export const isCurrentVenueRequestingSelector: SparkleSelector<boolean> = makeIsRequestingSelector(
  "currentVenue"
);

export const isCurrentEventRequestedSelector: SparkleSelector<boolean> = makeIsRequestedSelector(
  "currentEvent"
);

export const isUserPurchaseHistoryRequestedSelector: SparkleSelector<boolean> = makeIsRequestedSelector(
  "userPurchaseHistory"
);

export const venueChatMessagesSelector: SparkleSelector<
  WithId<VenueChatMessage>[] | undefined
> = (state) => state.firestore.ordered.venueChatMessages;

export const privateChatMessagesSelector: SparkleSelector<
  WithId<PrivateChatMessage>[] | undefined
> = (state) => state.firestore.ordered.privateChatMessages;

export const chatUsersByIdSelector: SparkleSelector<
  Record<string, User> | undefined
> = (state) => state.firestore.data.chatUsers;

export const experienceSelector: SparkleSelector<Experience | undefined> = (
  state
) => state.firestore.data.experience;

export const reactionsSelector: SparkleSelector<
  WithId<Reaction>[] | undefined
> = (state) => state.firestore.ordered.reactions;

export const messagesToTheBandSelector: SparkleSelector<
  WithId<TextReaction>[] | undefined
> = (state) =>
  reactionsSelector(state)?.filter(
    (reaction): reaction is WithId<TextReaction> =>
      reaction.reaction === TextReactionType
  );

export const venueSelector = (state: RootState) =>
  state.firestore.ordered.currentVenue?.[0];

export const parentVenueSelector: SparkleSelector<AnyVenue | undefined> = (
  state
) => state.firestore.data.parentVenue;

export const venueEventsSelector: SparkleSelector<
  WithId<VenueEvent>[] | undefined
> = (state) => state.firestore.ordered.venueEvents;

export const userModalVisitsSelector = (state: RootState) =>
  state.firestore.ordered.userModalVisits;

export const radioStationsSelector = (state: RootState) =>
  state.firestore.data.currentVenue?.radioStations;

export const posterVenuesSelector: SparkleSelector<
  WithId<PosterPageVenue>[] | undefined
> = (state) => state.firestore.ordered.posterVenues;

export const screeningRoomVideosSelector: SparkleSelector<
  WithId<ScreeningRoomVideo>[] | undefined
> = (state) => state.firestore.ordered.screeningRoomVideos;

/**
 * Selector to retrieve sovereignVenueId state from the Redux store.
 *
 * @param state the Redux store
 *
 * @see SovereignVenueState
 * @see RootState
 */
export const sovereignVenueIdSelector: SparkleSelector<SovereignVenueState> = (
  state
) => state.sovereignVenue;

export const chatVisibilitySelector: SparkleSelector<boolean> = (state) =>
  state.chat.isChatSidebarVisible;

export const userProfileSelector: SparkleSelector<WithId<User> | undefined> = (
  state
) => state.userProfile.userProfile;

export const selectedChatSettingsSelector: SparkleSelector<ChatSettings> = (
  state
) => state.chat.settings;

export const maybeSelector = <T>(
  ifTrue: boolean,
  selector: SparkleSelector<T>
): SparkleSelector<T> | SparkleSelector<undefined> =>
  ifTrue ? selector : noopSelector;

export const maybeArraySelector = <T>(
  ifTrue: boolean,
  selector: SparkleSelector<T[]>
): SparkleSelector<T[]> => (ifTrue ? selector : emptyArraySelector);

export const noopSelector: SparkleSelector<undefined> = () => undefined;

export const emptyArray = [];
export const emptyArraySelector = <T>(): T[] => emptyArray;

// AnimateMap
export const animateMapStageOptionsSelector: SparkleSelector<AnimateMapStageOptions> = (
  state
) => state.animatemap.stageOptions;

export const animateMapWorldBoundsSelector: SparkleSelector<AnimateMapWorldBounds> = (
  state
) => {
  return {
    width: state.animatemap.worldWidth,
    height: state.animatemap.worldHeight,
  };
};

export const animateMapZoomSelector: SparkleSelector<number> = (state) =>
  state.animatemap.zoom;

export const animateMapUsersSelector: SparkleSelector<
  Map<string, ReplicatedUser>
> = (state) => state.animatemap.users;

export const animateMapVenuesSelector: SparkleSelector<
  Map<string, ReplicatedVenue>
> = (state) => state.animatemap.venues;

export const animateMapUsersQTSelector: SparkleSelector<QuadTree | null> = (
  state
) => state.animatemap.usersQT;

export const animateMapVenuesQTSelector: SparkleSelector<QuadTree | null> = (
  state
) => state.animatemap.venuesQT;
