import { PLAYA_TEMPLATES, SUBVENUE_TEMPLATES } from "settings";

import { User } from "types/User";
import {
  urlFromImage,
  AnyVenue,
  VenueTemplate,
  JazzbarVenue,
} from "types/venues";

import { FormValues } from "pages/Admin/Venue/DetailsForm";

import { WithId } from "./id";

export const canHaveSubvenues = (venue: AnyVenue): boolean =>
  SUBVENUE_TEMPLATES.includes(venue.template);

export const canBeDeleted = (venue: AnyVenue): boolean =>
  !PLAYA_TEMPLATES.includes(venue.template);

export const canHavePlacement = (venue: AnyVenue): boolean =>
  PLAYA_TEMPLATES.includes(venue.template);

export const checkIfValidVenueId = (venueId?: string): boolean => {
  if (typeof venueId !== "string") return false;

  return /[a-z0-9_]{1,250}/.test(venueId);
};

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
  venue: AnyVenue
) => {
  const rooms = venue.rooms?.map((room) => room.title) ?? [];

  const locations = [venue.name, ...rooms];

  return locations.flatMap((location) => peopleByLastSeenIn[location] ?? []);
};

export const createJazzbar = (values: FormValues): JazzbarVenue => {
  return {
    template: VenueTemplate.jazzbar,
    name: values.name || "Your Jazz Bar",
    mapIconImageUrl: urlFromImage(
      "/default-profile-pic.png",
      values.mapIconImageFile
    ),
    config: {
      theme: {
        primaryColor: "yellow",
        backgroundColor: "red",
      },
      landingPageConfig: {
        coverImageUrl: urlFromImage(
          "/default-profile-pic.png",
          values.bannerImageFile
        ),
        subtitle: values.subtitle || "Subtitle for your venue",
        description: values.description || "Description of your venue",
        presentation: [],
        checkList: [],
        quotations: [],
      },
    },
    host: {
      icon: urlFromImage("/default-profile-pic.png", values.logoImageFile),
    },
    owners: [],
    profile_questions: values.profile_questions ?? [],
    code_of_conduct_questions: [],
    termsAndConditions: [],
    adultContent: values.adultContent || false,
    width: values.width ?? 40,
    height: values.width ?? 40,
    // @debt Should these fields be defaulted like this? Or potentially undefined? Or?
    iframeUrl: "",
    logoImageUrl: "",
  };
};
