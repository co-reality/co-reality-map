import { Venue } from "types/venues";
import { User } from "types/User";
import {
  SUBVENUE_TEMPLATES,
  PLAYA_TEMPLATES,
  PLACEABLE_VENUE_TEMPLATES,
} from "settings";
import { WithId } from "./id";

export const canHaveEvents = (venue: Venue): boolean =>
  PLACEABLE_VENUE_TEMPLATES.includes(venue.template);

export const canHaveSubvenues = (venue: Venue): boolean =>
  SUBVENUE_TEMPLATES.includes(venue.template);

export const canBeDeleted = (venue: Venue): boolean =>
  !PLAYA_TEMPLATES.includes(venue.template);

export const canHavePlacement = (venue: Venue): boolean =>
  PLAYA_TEMPLATES.includes(venue.template);

export const peopleByLastSeenIn = (
  venueName: string,
  users?: readonly WithId<User>[]
) => {
  const result: { [lastSeenIn: string]: WithId<User>[] } = {};
  for (const user of users?.filter((u) => u.id !== undefined) ?? []) {
    if (user.lastSeenIn) {
      if (!(user.lastSeenIn[venueName] in result)) result[venueName] = [];
      if (user.lastSeenIn && user.lastSeenIn[venueName]) {
        result[venueName].push(user);
      }
    }
  }
  return result;
};

export const peopleAttending = (
  peopleByLastSeenIn: { [lastSeenIn: string]: WithId<User>[] },
  venue: Venue
) => {
  const rooms = venue.rooms?.map((room) => room.title) ?? [];

  const locations = [venue.name, ...rooms];

  return locations.flatMap((location) => peopleByLastSeenIn[location] ?? []);
};
