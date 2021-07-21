import { AttendanceActions } from "./Attendance";
import { CacheActions } from "./Cache";
import { ChatActions } from "./Chat";
import { LocationActions } from "./Location";
import { RoomActions } from "./Room";
import { SovereignVenueActions } from "./SovereignVenue";
import { UserProfileActions } from "./UserProfile";

export type RootActions =
  | AttendanceActions
  | ChatActions
  | LocationActions
  | RoomActions
  | SovereignVenueActions
  | UserProfileActions
  | CacheActions;
