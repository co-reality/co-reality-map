import { CSSProperties } from "react";

import {
  API_KEY,
  APP_ID,
  MEASUREMENT_ID,
  BUCKET_URL,
  PROJECT_ID,
  IS_BURN,
} from "secrets";
import { VenueTemplate } from "types/venues";
import { FIVE_MINUTES_MS } from "utils/time";
import { UserStatus } from "types/User";

import sparkleNavLogo from "assets/icons/sparkle-nav-logo.png";
import defaultMapIcon from "assets/icons/default-map-icon.png";
import sparkleverseLogo from "assets/images/sparkleverse-logo.png";

export const SPARKLE_HOMEPAGE_URL = "https://sparklespaces.com/";
export const SPARKLE_TERMS_AND_CONDITIONS_URL =
  "https://sparklespaces.com/terms-of-use/";
export const SPARKLE_PRIVACY_POLICY =
  "https://sparklespaces.com/privacy-policy/";

// Sparkle facebook app id. More settings can be found at https://developers.facebook.com/apps/2633721400264126/dashboard/
export const FACEBOOK_SPARKLE_APP_ID = "2633721400264126";

export const SPARKLEVERSE_HOMEPAGE_URL = "https://sparklever.se/";
export const SPARKLEVERSE_TERMS_AND_CONDITIONS_URL =
  "https://sparklever.se/terms-and-conditions";
export const SPARKLEVERSE_PRIVACY_POLICY =
  "https://sparklever.se/privacy-policy/";
export const PLATFORM_BRAND_NAME = "Sparkle";

export const HOMEPAGE_URL = IS_BURN
  ? SPARKLEVERSE_HOMEPAGE_URL
  : SPARKLE_HOMEPAGE_URL;

export const TERMS_AND_CONDITIONS_URL = IS_BURN
  ? SPARKLEVERSE_TERMS_AND_CONDITIONS_URL
  : SPARKLE_TERMS_AND_CONDITIONS_URL;

export const PRIVACY_POLICY = IS_BURN
  ? SPARKLEVERSE_PRIVACY_POLICY
  : SPARKLE_PRIVACY_POLICY;

export const SPARKLE_ICON = "/sparkle-icon.png";
export const DEFAULT_MAP_BACKGROUND = "/maps/Sparkle_Field_Background.jpg";
export const DEFAULT_VENUE_BANNER = "/assets/Sparkle_Banner_Default.jpg";
export const DEFAULT_VENUE_LOGO = "/assets/Sparkle_SquareLogo_Default.jpg";
// @debt de-duplicate DEFAULT_PROFILE_IMAGE, DEFAULT_AVATAR_IMAGE, DEFAULT_PROFILE_PIC. Are they all used for the same concept?
export const DEFAULT_PROFILE_IMAGE = "/anonymous-profile-icon.jpeg";
export const DEFAULT_AVATAR_IMAGE = sparkleNavLogo;
export const DEFAULT_PROFILE_PIC = "/default-profile-pic.png";
export const DEFAULT_MAP_ICON_URL = defaultMapIcon;
export const SPARKLEVERSE_LOGO_URL = sparkleverseLogo;

export const DEFAULT_PARTY_NAME = "Anon";
export const DISPLAY_NAME_MAX_CHAR_COUNT = 40;
export const VENUE_CHAT_AGE_DAYS = 30;
export const VENUE_NAME_MIN_CHAR_COUNT = 3;
export const VENUE_NAME_MAX_CHAR_COUNT = 50;
export const PLAYA_VENUE_NAME = "Jam";
export const PLAYA_VENUE_ID = "jamonline";
export const GIFT_TICKET_MODAL_URL =
  "https://here.burningman.org/event/virtualburn";
export const BURNING_MAN_DONATION_TITLE = `Donate to WWF Australia.`;
export const BURNING_MAN_DONATION_TEXT = `To assist in the rebuilding of the Australian ecology after the devastating fires over last summer.`;
export const BURNING_MAN_DONATION_SITE = `https://donate.wwf.org.au/donate/one-off-donation/one-off-donation`;
export const PLAYA_INFO_URL =
  "https://us02web.zoom.us/j/89955369645?pwd=VEY1VzFPemNKMEw2bHRLdDJpWnRmQT09";
export const PLAYA_INFO_NAME = "Playa Info";
export const REALITY_RANGERS_URL = "https://multiverserangers.org/rangers911/";
export const REALITY_RANGERS_NAME = "Multiverse Rangers Chat";
export const DEFAULT_USER_LIST_LIMIT = 22;
export const DEFAULT_ROOM_ATTENDANCE_LIMIT = 2;
export const GIF_RESIZER_URL = "https://gifgifs.com/resizer/";
export const CREATE_EDIT_URL = "/admin";
export const SPARKLEVERSITY_URL = "https://sparklever.se/sparkleversity";
export const SPARKLEVERSE_COMMUNITY_URL =
  "https://www.facebook.com/groups/sparkleverse/";
export const CURRENT_TIME_IN_LOCATION = "Matong State Forest";

export const DUST_STORM_TEXT_1 = `A dust storm is ripping across the ${PLAYA_VENUE_NAME}!`;
export const DUST_STORM_TEXT_2 =
  "Your only option is to seek shelter in a nearby venue!";

// How often to refresh events schedule
export const REFETCH_SCHEDULE_MS = 10 * 60 * 1000; // 10 mins

// @debt FIVE_MINUTES_MS is deprecated; use utils/time or date-fns functions instead
// How often to update location for counting
export const LOC_UPDATE_FREQ_MS = FIVE_MINUTES_MS;

// How often to increment user's timespent
export const LOCATION_INCREMENT_SECONDS = 10;
export const LOCATION_INCREMENT_MS = LOCATION_INCREMENT_SECONDS * 1000;

// How often to refresh daypart logic
export const PLAYA_BG_DAYPART_MS = 60 * 1000; // 1 min

// How often to refresh current time line in the schedule
export const SCHEDULE_CURRENT_TIMELINE_MS = 60 * 1000; // 1 min

// How often to refresh event status (passed / happening now / haven't started)
export const EVENT_STATUS_REFRESH_MS = 60 * 1000; // 1 min

export const ROOM_IMAGE_WIDTH_PX = 300;
export const MAX_IMAGE_FILE_SIZE_BYTES = 1024 * 2000;
export const MAX_IMAGE_FILE_SIZE_TEXT = "2MB";
export const MAX_AVATAR_IMAGE_FILE_SIZE_BYTES = 1024 * 150;
export const GIF_IMAGE_WIDTH_PX = 300;

export const MIN_TABLE_CAPACITY = 2;
export const MAX_TABLE_CAPACITY = 10;

export const DOCUMENT_ID = "__name__";
export const NUM_CHAT_UIDS_TO_LOAD = 10;

export const MINIMUM_COLUMNS = 5;
export const MAXIMUM_COLUMNS = 100;
// playa is 4000x4000 pixels, Burning Seed paddock is 2000x2000
export const PLAYA_HEIGHT = 2000;
export const PLAYA_WIDTH = 3000;
export const PLAYA_AVATAR_SIZE = 48;
export const PLAYA_VENUE_SIZE = 40;
export const PLAYA_ICON_SIDE_PERCENTAGE = 5;
// Burning Seed: playa is named paddock
export const PLAYA_IMAGE = "/maps/paddock2k.jpg";
export const PLAYA_VENUE_STYLES: Record<string, CSSProperties> = {
  iconImage: {
    width: PLAYA_VENUE_SIZE,
    height: PLAYA_VENUE_SIZE,
    overflow: "hidden",
    borderRadius: "25%",
    background: "rgba(147, 124, 99, 0.2)",
    border: "2px solid rgba(147, 124, 99, 0.2)",
    animation: "ripple 4s linear infinite",
  },
  draggableIconImage: {
    width: PLAYA_VENUE_SIZE * 1.5,
    height: PLAYA_VENUE_SIZE * 1.5,
    overflow: "hidden",
    borderRadius: "25%",
    background: "rgba(147, 124, 99, 0.2)",
    border: "2px solid rgba(147, 124, 99, 0.2)",
    animation: "ripple 4s linear infinite",
  },
};

export const ACCEPTED_IMAGE_TYPES =
  "image/png,image/x-png,image/gif,image/jpg,image/jpeg,image/tiff,image/bmp,image/gif";

export const VALID_URL_PROTOCOLS = ["http:", "https:"];

export const IFRAME_ALLOW =
  "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";

export const ENABLE_SUSPECTED_LOCATION = false;
export const ENABLE_PLAYA_ADDRESS = false;

// These templates use zoomUrl (they should remain alphabetically sorted)
// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
// @debt unify this with ZOOM_URL_TEMPLATES in functions/venue.js + share the same code between frontend/backend
export const ZOOM_URL_TEMPLATES = [
  VenueTemplate.artcar,
  VenueTemplate.zoomroom,
];

// These templates use iframeUrl (they should remain alphabetically sorted)
// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
// @debt unify this with IFRAME_TEMPLATES in functions/venue.js + share the same code between frontend/backend
export const IFRAME_TEMPLATES = [
  VenueTemplate.artpiece,
  VenueTemplate.audience,
  VenueTemplate.embeddable,
  VenueTemplate.firebarrel,
  VenueTemplate.jazzbar,
  VenueTemplate.performancevenue,
];

// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
export const BACKGROUND_IMG_TEMPLATES = [
  VenueTemplate.themecamp,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
];

// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
export const SUBVENUE_TEMPLATES = [
  VenueTemplate.themecamp,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
];

// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
export const PLACEABLE_VENUE_TEMPLATES = [
  VenueTemplate.artcar,
  VenueTemplate.artpiece,
  VenueTemplate.friendship,
  VenueTemplate.jazzbar,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
  VenueTemplate.performancevenue,
  VenueTemplate.themecamp,
  VenueTemplate.zoomroom,
];

// @debt Refactor this constant into types/venues + create an actual custom type grouping for it
export const PLAYA_TEMPLATES = [VenueTemplate.playa, VenueTemplate.preplaya];

// @debt Refactor this constant into types/templates or similar?
export interface Template {
  template: VenueTemplate;
  name: string;
  description: Array<string>;
}

// @debt Refactor this constant into types/templates or similar?
export interface Template_v2 {
  template?: VenueTemplate;
  name: string;
  subtitle?: string;
  description: Array<string>;
}

// @debt Refactor this constant into types/templates or similar?
export const BURN_VENUE_TEMPLATES: Array<Template> = [
  {
    template: VenueTemplate.conversationspace,
    name: "Conversation Space",
    description: ["A room of tables in which to talk and make merry."],
  },
  {
    template: VenueTemplate.zoomroom, // keeping as zoom room for backward compatibility
    name: "Experience",
    description: [
      "Ideal for performances, debates, interactive sessions of all kinds: a Zoom room with its own spot on the Jam",
    ],
  },
  {
    template: VenueTemplate.partymap,
    name: "Party Map",
    description: [
      "An explorable party map into which you can place all your party rooms.",
    ],
  },
  {
    template: VenueTemplate.animatemap,
    name: "Animate Map",
    description: [
      "An explorable party map into which you can place all your party rooms.",
    ],
  },
  {
    template: VenueTemplate.artpiece,
    name: "Art Piece",
    description: [
      "Embed any 2-D or 3-D art experience on the Jam with this special template, which allows viewers to chat to each other as they experience your art.",
    ],
  },
  {
    template: VenueTemplate.jazzbar,
    name: "Music Venue",
    description: [
      "Add a music venue with an embedded video and tables for people to join to have video chats and discuss life, the universe, and everything.",
    ],
  },
  {
    template: VenueTemplate.audience,
    name: "Auditorium",
    description: [
      "Add an auditorium with an embedded video and seats for people to take to watch the experience.",
    ],
  },
  {
    template: VenueTemplate.firebarrel,
    name: "Fire Barrel",
    description: ["Huddle around a fire barrel with your close friends"],
  },
  {
    template: VenueTemplate.embeddable,
    name: "Embeddable",
    description: [
      "Insert almost anything into a styled iFrame. This space does not have video chatting.",
    ],
  },
];

// @debt Refactor this constant into types/templates or similar?
// @debt this doesn't seem to even be used at the moment.. should it be?
export const BURN_VENUE_TEMPLATES_V2: Array<Template_v2> = [
  {
    template: VenueTemplate.zoomroom, // keeping as zoom room for backward compatibility
    name: "Experience",
    description: [
      "Ideal for performances, debates, interactive sessions of all kinds: a Zoom room with its own spot on the Jam",
    ],
  },
  {
    template: VenueTemplate.themecamp,
    name: "Theme Camp",
    description: [
      "Add your camp to the Jam in the form of a clickable map; then add tents, bars, domes and other spaces to your camp map.",
    ],
  },
  {
    template: VenueTemplate.artpiece,
    name: "Art Piece",
    description: [
      "Embed any 2-D or 3-D art experience on the Jam with this special template, which allows viewers to chat to each other as they experience your art.",
    ],
  },
  {
    template: VenueTemplate.jazzbar,
    name: "Music Venue",
    description: [
      "Add a music venue with an embedded video and tables for people to join to have video chats and discuss life, the universe, and everything.",
    ],
  },
  {
    template: VenueTemplate.audience,
    name: "Auditorium",
    description: [
      "Add an auditorium with an embedded video and seats for people to take to watch the experience.",
    ],
  },
  {
    template: VenueTemplate.firebarrel,
    name: "Fire Barrel",
    description: ["Huddle around a fire barrel with your close friends"],
  },
  {
    template: VenueTemplate.embeddable,
    name: "Embeddable",
    description: [
      "Insert almost anything into a styled iFrame. This space does not have video chatting.",
    ],
  },
];

// @debt Refactor this constant into types/templates or similar?
export const ALL_VENUE_TEMPLATES: Array<Template> = [
  ...BURN_VENUE_TEMPLATES,
  {
    template: VenueTemplate.jazzbar,
    name: "Jazz Bar",
    description: ["Create a jazzbar."],
  },

  {
    template: VenueTemplate.artcar,
    name: "Art Car",
    description: ["Create a space on the Jam that moves around."],
  },
  {
    template: VenueTemplate.performancevenue,
    name: "Performance Venue",
    description: [
      "Create a live performance space with tables, audience reactions and video chat between people in the venue.",
    ],
  },
  {
    template: VenueTemplate.partymap,
    name: "Party Map",
    description: [""],
  },
  {
    template: VenueTemplate.themecamp,
    name: "Theme Camp (legacy)",
    description: ["To be removed asap"],
  },
  {
    template: VenueTemplate.animatemap,
    name: "AnimateMap",
    description: [""],
  },
];

// @debt Refactor this constant into types/templates or similar?
// @debt this doesn't seem to even be used at the moment.. should it be?
export const ALL_VENUE_TEMPLATES_V2: Array<Template_v2> = [
  ...BURN_VENUE_TEMPLATES,
  {
    template: VenueTemplate.jazzbar,
    name: "Jazz Bar",
    description: ["Create a jazzbar."],
  },

  {
    template: VenueTemplate.artcar,
    name: "Art Car",
    description: ["Create a space on the Jam that moves around."],
  },
  {
    template: VenueTemplate.performancevenue,
    name: "Performance Venue",
    description: [
      "Create a live performance space with tables, audience reactions and video chat between people in the venue.",
    ],
  },
  {
    template: VenueTemplate.partymap,
    name: "Party Map",
    description: [""],
  },
  {
    template: VenueTemplate.animatemap,
    name: "AnimateMap",
    description: [""],
  },
];

// @debt Refactor this into types/???
export type CustomInputsType = {
  name: string;
  title: string;
  type: "text" | "textarea" | "number" | "switch";
  // ? Maybe add a field for specific regex patterns
  // ? if we want the field to be a zoom url
  // ? it must include `zoom.com/`
};

// @debt Refactor this into types/templates or similar?
export type RoomTemplate = {
  template: VenueTemplate;
  name: string;
  description: string;
  icon: string;
  url?: string;
  customInputs?: CustomInputsType[];
};

// @debt Refactor this constant into types/templates or similar?
export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    template: VenueTemplate.artpiece,
    name: "Art Piece",
    description:
      "Embed any 2-D or 3-D art experience on the Jam with this special template, which allows viewers to chat to each other as they experience your art.",
    icon: "/venues/pickspace-thumbnail_art.png",
    customInputs: [
      {
        name: "iframeUrl",
        title: "Livestream URL",
        type: "text",
      },
      {
        name: "bannerMessage",
        title: "Show an announcement in the venue (or leave blank for none)",
        type: "text",
      },
    ],
  },
  {
    template: VenueTemplate.audience,
    name: "Auditorium",
    description:
      "Add an auditorium with an embedded video and seats for people to take to watch the experience.",
    icon: "/venues/pickspace-thumbnail_auditorium.png",
    customInputs: [
      {
        name: "iframeUrl",
        title: "Livestream URL",
        type: "text",
      },
    ],
  },
  {
    template: VenueTemplate.zoomroom,
    name: "Experience",
    description:
      "Ideal for performances, debates, interactive sessions of all kinds: a Zoom room with its own spot on the Jam",
    icon: "/venues/pickspace-thumbnail_zoom.png",
  },
  {
    template: VenueTemplate.firebarrel,
    name: "Burn Barrel (Campfire?)",
    description: "Huddle around a fire barrel with your close friends",
    icon: "/rooms/room-icon-fire.png",
  },
  {
    template: VenueTemplate.jazzbar,
    name: "Music Bar",
    description:
      "Add a music venue with an embedded video and tables for people to join to have video chats and discuss life, the universe, and everything.",
    icon: "/rooms/room-icon-musicbar.png",
    customInputs: [
      {
        name: "iframeUrl",
        title: "Livestream URL",
        type: "text",
      },
    ],
  },
  {
    template: VenueTemplate.partymap,
    name: "Partymap",
    description:
      "Add your camp to the Jam in the form of a clickable map; then add tents, bars, domes and other spaces to your camp map.",
    icon: "/venues/pickspace-thumbnail_camp.png",
    customInputs: [
      {
        name: "bannerMessage",
        title: "Show an announcement in the venue (or leave blank for none)",
        type: "text",
      },
    ],
  },
  {
    template: VenueTemplate.animatemap,
    name: "AnimateMap",
    description: "Add your Animate Map",
    icon: "/venues/pickspace-thumbnail_camp.png",
    customInputs: [
      {
        name: "bannerMessage",
        title: "Show an announcement in the venue (or leave blank for none)",
        type: "text",
      },
    ],
  },
  {
    template: VenueTemplate.embeddable,
    name: "Embeddable",
    description:
      "Insert almost anything into a styled iFrame. This space does not have video chatting.",
    icon: "",
    customInputs: [
      {
        name: "iframeUrl",
        title: "Livestream URL",
        type: "text",
      },
    ],
  },
];

// @debt Refactor this constant into types/templates + create an actual custom type grouping for it
export const HAS_ROOMS_TEMPLATES: Array<VenueTemplate> = [
  VenueTemplate.themecamp,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
  VenueTemplate.playa,
];

// @debt Refactor this constant into types/templates + create an actual custom type grouping for it
export const HAS_GRID_TEMPLATES: Array<VenueTemplate> = [
  VenueTemplate.themecamp,
  VenueTemplate.partymap,
  VenueTemplate.animatemap,
];

// @debt Refactor this constant into types/templates + create an actual custom type grouping for it
export const HAS_REACTIONS_TEMPLATES: Array<VenueTemplate> = [
  VenueTemplate.audience,
];

// @debt Refactor this constant into types/templates + create an actual custom type grouping for it
export const BANNER_MESSAGE_TEMPLATES: Array<VenueTemplate> = [
  VenueTemplate.playa,
  VenueTemplate.preplaya,
  VenueTemplate.themecamp,
  VenueTemplate.artpiece,
];

// @debt Refactor this constant into types/templates + create an actual custom type grouping for it
export const ALL_BURN_TEMPLATES: Array<VenueTemplate> = [
  VenueTemplate.playa,
  VenueTemplate.preplaya,
  VenueTemplate.zoomroom,
  VenueTemplate.artcar,
  VenueTemplate.artpiece,
  VenueTemplate.audience,
  VenueTemplate.performancevenue,
  VenueTemplate.themecamp,
];

export const FIREBASE_CONFIG = {
  apiKey: API_KEY,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID,
  projectId: PROJECT_ID,
  storageBucket: BUCKET_URL,
};

export const DEFAULT_VENUE = "zilloween";
export const DEFAULT_REDIRECT_URL = IS_BURN ? "/enter" : HOMEPAGE_URL;

// Trouble connecting? Run a local relay:
// git clone git@github.com:sparkletown/sparkle-relay && cd sparkle-relay && docker-compose up
export const DEFAULT_WS_RELAY_URL = "ws://localhost:8080/";

export const USE_RANDOM_AVATAR = true;
export const RANDOM_AVATARS = [
  "avatar-01.png",
  "avatar-02.png",
  "avatar-03.png",
  "avatar-04.png",
  "avatar-05.png",
  "avatar-06.png",
  "avatar-07.png",
  "avatar-08.png",
  "avatar-09.png",
  "avatar-10.png",
  "avatar-11.png",
  "avatar-12.png",
];

export const CHAT_MESSAGE_TIMEOUT = 500; // time in ms

export const DEFAULT_AVATARS = [
  "/avatars/default-profile-pic-1.png",
  "/avatars/default-profile-pic-2.png",
  "/avatars/default-profile-pic-3.png",
  "/avatars/default-profile-pic-4.png",
];

export const REACTION_TIMEOUT = 5000; // time in ms
export const SHOW_EMOJI_IN_REACTION_PAGE = true;

export const ZENDESK_URL_PREFIXES = ["/admin"];

// Max questions number for Poll inside Chat
export const MAX_POLL_QUESTIONS = 8;

export const POSTERPAGE_MAX_VIDEO_PARTICIPANTS = 10;

export const SEARCH_DEBOUNCE_TIME = 200; // ms

export const DEFAULT_DISPLAYED_POSTER_PREVIEW_COUNT = 48;
export const DEFAULT_DISPLAYED_VIDEO_PREVIEW_COUNT = 12;

export const USER_STATUSES = [UserStatus.available, UserStatus.busy];

// SCHEDULE
// @debt probably would be better to adjust max hour based on user's display size
export const SCHEDULE_MAX_START_HOUR = 16;
export const SCHEDULE_HOUR_COLUMN_WIDTH_PX = 200;
export const SCHEDULE_SHOW_DAYS_AHEAD = 7;
/**
 * @see https://firebase.google.com/docs/firestore/query-data/queries#in_not-in_and_array-contains-any
 */
export const FIRESTORE_QUERY_IN_ARRAY_MAX_ITEMS = 10;

export const FACEBOOK_SHARE_URL = "https://www.facebook.com/sharer/sharer.php?";
export const TWITTER_SHARE_URL = "https://twitter.com/intent/tweet?";

// Markdown

export const MARKDOWN_BASIC_FORMATTING_TAGS = [
  "p",
  "strong",
  "em",
  "blockquote",
  "hr",
  "del",
];
export const MARKDOWN_HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
export const MARKDOWN_IMAGE_TAGS = ["img"];
export const MARKDOWN_LINK_TAGS = ["a"];
export const MARKDOWN_LIST_TAGS = ["ol", "ul", "li"];
export const MARKDOWN_PRE_CODE_TAGS = ["pre", "code"];
