import { AuditoriumSection } from "types/auditorium";
import { ChatRequest } from "types/ChatRequest";
import { PrivateChatMessage, VenueChatMessage } from "types/chat";
import { Purchase } from "types/Purchase";
import { Reaction } from "types/reactions";
import { Role } from "types/Role";
import { ScreeningRoomVideo } from "types/screeningRoom";
import { Table } from "types/Table";
import { AnyVenue, PosterPageVenue, VenueEvent } from "types/venues";

import { WithId } from "utils/id";

import { AdminRole } from "hooks/roles";

export interface Experience {
  reactions: Record<string, Reaction>;
  tables: Record<string, Record<string, Table>>;
}

export interface UserVisit {
  timeSpent: number;
}

export type ValidFirestoreRootCollections =
  | "customers"
  | "experiences"
  | "purchases"
  | "roles"
  | "userprivate"
  | "users"
  | "venues";

export type ValidFirestoreKeys = keyof FirestoreData | keyof FirestoreOrdered;

export type ValidStoreAsKeys = Exclude<
  ValidFirestoreKeys,
  ValidFirestoreRootCollections
>;

export interface Firestore {
  data: FirestoreData;
  ordered: FirestoreOrdered;
  status: FirestoreStatus;
}

export interface FirestoreStatus {
  requesting: Record<ValidFirestoreKeys, boolean>;
  requested: Record<ValidFirestoreKeys, boolean>;
  timestamps: Record<ValidFirestoreKeys, number>;
}

// note: these entries should be sorted alphabetically
export interface FirestoreData {
  adminRole?: AdminRole;
  allowAllRoles?: Record<string, Role>;
  // @debt this doesn't appear to be used by anything anymore
  // chatUsers?: Record<string, User>;
  currentEvent?: Record<string, VenueEvent>;
  currentVenue?: AnyVenue;
  sovereignVenue?: AnyVenue;
  currentVenueEventsNG?: Record<string, VenueEvent>;
  currentVenueNG?: AnyVenue;
  currentAuditoriumSections?: Partial<Record<string, AuditoriumSection>>;
  eventPurchase?: Record<string, Purchase>;
  events?: Record<string, VenueEvent>;
  experience?: Experience;
  playaVenues?: Record<string, AnyVenue>; // for the admin playa preview
  reactions?: Record<string, Reaction>;
  screeningRoomVideos: Record<string, ScreeningRoomVideo>;
  // @debt this doesn't appear to be used by anything anymore
  // userModalVisits?: Record<string, UserVisit>;
  userPurchaseHistory?: Record<string, Purchase>;
  userRoles?: Record<string, Role>;
  venueChatMessages?: Record<string, VenueChatMessage>;
  venueEvents?: Record<string, VenueEvent>;

  /**
   * @deprecated This state requires all of the venues data in firebase to be loaded into memory. Find a different way.
   * @debt Refactor all places that rely on this, then remove it from the codebase
   */
  venues?: Record<string, AnyVenue>;
}

// note: these entries should be sorted alphabetically
export interface FirestoreOrdered {
  chatRequests?: WithId<ChatRequest>[];
  currentEvent?: WithId<VenueEvent>[];
  currentVenue?: WithId<AnyVenue>[];
  sovereignVenue?: WithId<AnyVenue>[];
  currentVenueEventsNG?: WithId<VenueEvent>[];
  currentVenueNG?: WithId<AnyVenue>[];
  currentAuditoriumSections?: WithId<AuditoriumSection>[];
  eventPurchase?: WithId<Purchase>[];
  events?: WithId<VenueEvent>[];
  experience: WithId<Experience>;
  parentVenueEvents?: WithId<VenueEvent>[];
  playaVenues?: WithId<AnyVenue>[];
  reactions?: WithId<Reaction>[];
  screeningRoomVideos: WithId<ScreeningRoomVideo>[];
  siblingVenues?: WithId<AnyVenue>[];
  siblingVenueEvents?: WithId<VenueEvent>[];
  // @debt this doesn't appear to be used by anything anymore
  // statsOnlineUsers?: WithId<User>[];
  // statsOpenVenues?: WithId<AnyVenue>[];
  // subvenues?: WithId<AnyVenue>[];
  subvenueEvents?: WithId<VenueEvent>[];
  userModalVisits?: WithId<UserVisit>[];
  userPurchaseHistory?: WithId<Purchase>[];
  privateChatMessages?: WithId<PrivateChatMessage>[];
  posterVenues?: WithId<PosterPageVenue>[];
  venueChatMessages?: WithId<VenueChatMessage>[];
  venueEvents?: WithId<VenueEvent>[];

  /**
   * @deprecated This state requires all of the venues data in firebase to be loaded into memory. Find a different way.
   * @debt Refactor all places that rely on this, then remove it from the codebase
   */
  venues?: WithId<AnyVenue>[];
}
