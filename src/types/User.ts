export interface Experience {
  bartender: User;
  table: string;
  row?: number;
  column?: number;
}

//@debt typing I think this is correct from Room.tsx, need to confirm
export type UserExperienceData = Record<string, Experience>;

// Store all things related to video chat where they can't be tampered with by other users
export type VideoState = {
  inRoomOwnedBy?: string;
  removedParticipantUids?: string[];
};

// the structure is { [key: venueId] : eventId[] }
export type MyPersonalizedSchedule = Partial<Record<string, string[]>>;

export interface ProfileLink {
  title: string;
  url: string;
}
export interface User {
  drinkOfChoice?: string;
  favouriteRecord?: string;
  doYouDance?: string;
  partyName?: string;
  pictureUrl?: string;
  data?: UserExperienceData;
  lastSeenIn: { [key: string]: number };
  lastSeenAt: number;
  room?: string;
  // @debt typing - user also has a dynamic set of attributes for the question answers
  // currently not possible to type them properly
  // [question: string]: string;
  video?: VideoState;
  mirrorVideo: boolean;
  kidsMode: boolean;
  anonMode: boolean;
  enteredVenueIds?: string[];
  status?: string;
  myPersonalizedSchedule?: MyPersonalizedSchedule;
  profileLinks?: ProfileLink[];
}

export enum UserStatus {
  available = "available",
  busy = "busy",
}

export enum RecentUserStatusType {
  online = "online",
  offline = "offline",
  busy = "busy",
}

export enum UsernameVisibility {
  none = "none",
  hover = "hover",
  inline = "inline",
}
