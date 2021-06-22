import { roomReducer } from "./Room";
import { locationReducer } from "./Location";
import { attendanceReducer } from "./Attendance";
import { chatReducer } from "./Chat";
import { sovereignVenueReducer } from "./SovereignVenue";
import { userProfileReducer } from "./UserProfile";
import { animateMapReducer } from "./AnimateMap";
import { VenueTemplate } from "../../types/venues";

// Reducers per VenueTemplate (eg. reducer for playa template)
export const VenueTemplateReducers = {
  [VenueTemplate.animatemap]: animateMapReducer,
};

// Other reducers (room entry/exit, mute reactions, etc.)
export const MiscReducers = {
  attendance: attendanceReducer,
  chat: chatReducer,
  location: locationReducer,
  room: roomReducer,
  sovereignVenue: sovereignVenueReducer,
  userProfile: userProfileReducer,
};
