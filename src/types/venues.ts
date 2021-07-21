import { CSSProperties } from "react";

import { HAS_ROOMS_TEMPLATES } from "settings";

import { WithVenueId } from "utils/id";

import { EntranceStepConfig } from "./EntranceStep";
import { Poster } from "./posters";
import { Quotation } from "./Quotation";
import { Room } from "./rooms";
import { Table } from "./Table";
import { UpcomingEvent } from "./UpcomingEvent";
import { UserStatus, UsernameVisibility } from "./User";
import { VenueAccessMode } from "./VenueAcccess";
import { VideoAspectRatio } from "./VideoAspectRatio";

// These represent all of our templates (they should remain alphabetically sorted, deprecated should be separate from the rest)
// @debt unify this with VenueTemplate in functions/venue.js + share the same code between frontend/backend
export enum VenueTemplate {
  artcar = "artcar",
  artpiece = "artpiece",
  audience = "audience",
  auditorium = "auditorium",
  conversationspace = "conversationspace",
  embeddable = "embeddable",
  firebarrel = "firebarrel",
  friendship = "friendship",
  jazzbar = "jazzbar",
  partymap = "partymap",
  performancevenue = "performancevenue",
  playa = "playa",
  posterhall = "posterhall",
  posterpage = "posterpage",
  preplaya = "preplaya",
  screeningroom = "screeningroom",
  themecamp = "themecamp",
  zoomroom = "zoomroom",

  /**
   * @deprecated Legacy template removed, perhaps try VenueTemplate.partymap instead?
   */
  avatargrid = "avatargrid",
}

// This type should have entries to exclude anything that has it's own specific type entry in AnyVenue below
export type GenericVenueTemplates = Exclude<
  VenueTemplate,
  | VenueTemplate.embeddable
  | VenueTemplate.jazzbar
  | VenueTemplate.partymap
  | VenueTemplate.posterpage
  | VenueTemplate.themecamp
  | VenueTemplate.auditorium
>;

// We shouldn't include 'Venue' here, that is what 'GenericVenue' is for (which correctly narrows the types; these should remain alphabetically sorted, except with GenericVenue at the top)
export type AnyVenue =
  | GenericVenue
  | AuditoriumVenue
  | EmbeddableVenue
  | JazzbarVenue
  | PartyMapVenue
  | PosterPageVenue;

// --- VENUE V2
export interface Venue_v2
  extends Venue_v2_Base,
    Venue_v2_AdvancedConfig,
    Venue_v2_EntranceConfig {}

export interface Venue_v2_Base {
  name: string;
  config: {
    landingPageConfig: {
      subtitle: string;
      description: string;
      coverImageUrl: string;
    };
  };
  host: {
    icon: string;
  };
  owners: string[];
  theme?: {
    primaryColor: string;
    backgroundColor?: string;
  };
  id: string;
  rooms?: Room[];
  mapBackgroundImageUrl?: string;
}

export interface Venue_v2_AdvancedConfig {
  attendeesTitle?: string;
  bannerMessage?: string;
  chatTitle?: string;
  columns?: number;
  radioStations?: string | string[]; // single string on form, array in DB
  requiresDateOfBirth?: boolean;
  roomVisibility?: RoomVisibility;
  showBadges?: boolean;
  showGrid?: boolean;
  showNametags?: UsernameVisibility;
  showRadio?: boolean;
  showRangers?: boolean;
}

export interface Venue_v2_EntranceConfig {
  profile_questions?: Array<Question>;
  code_of_conduct_questions?: Array<Question>;
  entrance?: EntranceStepConfig[];
}

// @debt refactor this into separated logical chunks? (eg. if certain params are only expected to be set for certain venue types)
// @debt The following keys are marked as required on this type, but i'm not sure they should be:
//   profile_questions, code_of_conduct_questions, termsAndConditions, width, height
export interface BaseVenue {
  template: VenueTemplate;
  parentId?: string;
  name: string;
  access?: VenueAccessMode;
  entrance?: EntranceStepConfig[];
  config?: VenueConfig;
  host?: {
    icon: string;
  };
  profile_questions: Question[];
  code_of_conduct_questions: Question[];
  owners: string[];
  iframeUrl?: string;
  events?: Array<UpcomingEvent>; //@debt typing is this optional? I have a feeling this no longer exists @chris confirm
  mapIconImageUrl?: string;
  placement?: VenuePlacement;
  zoomUrl?: string;
  mapBackgroundImageUrl?: string;
  placementRequests?: string;
  radioStations?: string[];
  radioTitle?: string;
  dustStorm?: boolean;
  activity?: string;
  bannerMessage?: string;
  playaIcon?: PlayaIcon;
  playaIcon2?: PlayaIcon;
  miniAvatars?: boolean;
  adultContent?: boolean;
  samlAuthProviderId?: string;
  showAddress?: boolean;
  showGiftATicket?: boolean;
  columns?: number;
  rows?: number;
  nightCycle?: boolean;
  hasPaidEvents?: boolean;
  profileAvatars?: boolean;
  hideVideo?: boolean;
  showSchedule?: boolean;
  showGrid?: boolean;
  roomVisibility?: RoomVisibility;
  rooms?: Room[];
  width: number;
  height: number;
  description?: {
    text: string;
  };
  showLearnMoreLink?: boolean;
  start_utc_seconds?: number;
  end_utc_seconds?: number; // Note: this is intended to only be set/used on the sovereign venue, to define the end timestamp of the entire party/event
  attendeesTitle?: string;
  requiresDateOfBirth?: boolean;
  ticketUrl?: string;
  showRangers?: boolean;
  chatTitle?: string;
  showReactions?: boolean;
  showShoutouts?: boolean;
  auditoriumColumns?: number;
  auditoriumRows?: number;
  videoAspect?: VideoAspectRatio;
  termsAndConditions: TermOfService[];
  userStatuses?: UserStatus[];
  showRadio?: boolean;
  showBadges?: boolean;
  showNametags?: UsernameVisibility;
  showUserStatus?: boolean;
}

export interface GenericVenue extends BaseVenue {
  template: GenericVenueTemplates;
}

// @debt which of these params are exactly the same as on Venue? Can we simplify this?
// @debt we probably don't want to include id directly here.. that's what WithId is for
export interface PartyMapVenue extends BaseVenue {
  id: string;
  template: VenueTemplate.partymap | VenueTemplate.themecamp;

  // @debt The following keys are marked as required on this type, but i'm not sure they should be:
  //   url, name (we seem to be using icon to hold the URL of the image)
  host?: {
    url: string;
    icon: string;
    name: string;
  };

  description?: {
    text: string;
    program_url?: string;
  };

  start_utc_seconds?: number;
  duration_hours?: number;
  entrance_hosted_hours?: number;
  party_name?: string;
  unhosted_entry_video_url?: string;
  map_url?: string;
  map_viewbox?: string;
  password?: string;
  admin_password?: string;
  owners: string[];
  rooms?: Room[];
}

export interface JazzbarVenue extends BaseVenue {
  template: VenueTemplate.jazzbar;
  iframeUrl: string;
  logoImageUrl: string;
  host: {
    icon: string;
  };
}

export interface EmbeddableVenue extends BaseVenue {
  template: VenueTemplate.embeddable;
  iframeUrl?: string;
  containerStyles?: CSSProperties;
  iframeStyles?: CSSProperties;
  iframeOptions?: Record<string, string>;
}

export interface PosterPageVenue extends BaseVenue {
  template: VenueTemplate.posterpage;
  poster?: Poster;
  isLive?: boolean;
}

export interface AuditoriumVenue extends BaseVenue {
  template: VenueTemplate.auditorium;
  title?: string;
}

export interface Question {
  name: string;
  text: string;
  link?: string;
}

interface TermOfService {
  name: string;
  text: string;
  link?: string;
}

export enum RoomVisibility {
  hover = "hover",
  count = "count",
  nameCount = "count/name",
}

export interface VenueConfig {
  theme: {
    primaryColor: string;
    backgroundColor?: string;
  };

  // @debt landingPageConfig should probably be 'potentially undefined', or is it guaranteed to exist everywhere?
  landingPageConfig: VenueLandingPageConfig;
  redirectUrl?: string;
  memberEmails?: string[];
  showRangers?: boolean;
  tables?: Table[];
}

// @debt The following keys are marked as required on this type, but i'm not sure they should be:
//   presentation, checkList
export interface VenueLandingPageConfig {
  coverImageUrl: string;
  subtitle: string;
  description?: string;
  presentation: string[];
  bannerImageUrl?: string;
  checkList: string[];
  iframeUrl?: string;
  joinButtonText?: string;
  quotations?: Quotation[];
}

export interface VenuePlacement {
  x: number;
  y: number;
  addressText?: string;
  state?: VenuePlacementState;
}

export enum VenuePlacementState {
  SelfPlaced = "SELF_PLACED",
  AdminPlaced = "ADMIN_PLACED",
  Hidden = "HIDDEN",
}

export interface PlayaIcon {
  x: number;
  y: number;
  fire: boolean;
  visible: boolean;
  className: string;
  clickable: boolean;
  venueId: string;
}

export interface VenueEvent {
  name: string;
  start_utc_seconds: number;
  description: string;
  descriptions?: string[];
  duration_minutes: number;
  price: number;
  collective_price: number;
  host: string;
  room?: string;
  id?: string;
}

export interface VenueLocation {
  venueId: string;
  roomTitle?: string;
  venueName?: string;
}

export interface LocationEvents {
  location: VenueLocation;
  events: PersonalizedVenueEvent[];
}

export interface PersonalizedVenueEvent extends WithVenueId<VenueEvent> {
  isSaved: boolean;
}

export const isVenueWithRooms = (venue: AnyVenue): venue is PartyMapVenue =>
  HAS_ROOMS_TEMPLATES.includes(venue.template);

export const isPartyMapVenue = (venue: AnyVenue): venue is PartyMapVenue =>
  venue.template === VenueTemplate.partymap;

export const urlFromImage = (
  defaultValue: string,
  filesOrUrl?: FileList | string
) => {
  if (typeof filesOrUrl === "string") return filesOrUrl;
  return filesOrUrl && filesOrUrl.length > 0
    ? URL.createObjectURL(filesOrUrl[0])
    : defaultValue;
};
