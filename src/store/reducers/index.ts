import { Reducer } from "redux";

import { roomReducer } from "./Room";
import { locationReducer } from "./Location";
import { attendanceReducer } from "./Attendance";
import { chatReducer } from "./Chat";
import { sovereignVenueReducer } from "./SovereignVenue";
import { userProfileReducer } from "./UserProfile";
import { cacheReducer } from "./Cache";

// Reducers per VenueTemplate (eg. reducer for playa template)
export const VenueTemplateReducers: { [key: string]: Reducer } = {};

// Other reducers (room entry/exit, mute reactions, etc.)
export const MiscReducers = {
  attendance: attendanceReducer,
  chat: chatReducer,
  location: locationReducer,
  room: roomReducer,
  sovereignVenue: sovereignVenueReducer,
  userProfile: userProfileReducer,
  cache: cacheReducer,
};
