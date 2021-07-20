import * as Yup from "yup";
import dayjs from "dayjs";

import {
  createUrlSafeName,
  VenueInput,
  PlacementInput,
  EventInput,
} from "api/admin";

import firebase from "firebase/app";
import "firebase/functions";
import {
  PLAYA_VENUE_SIZE,
  VENUE_NAME_MIN_CHAR_COUNT,
  VENUE_NAME_MAX_CHAR_COUNT,
  MAX_IMAGE_FILE_SIZE_BYTES,
  GIF_RESIZER_URL,
  PLAYA_WIDTH,
  PLAYA_HEIGHT,
} from "settings";
import { isValidUrl } from "utils/url";

const initialMapIconPlacement: VenueInput["placement"] = {
  x: (PLAYA_WIDTH - PLAYA_VENUE_SIZE) / 2,
  y: (PLAYA_HEIGHT - PLAYA_VENUE_SIZE) / 2,
};

export interface SchemaShape {
  name: string;
  subtitle: string;
  description: string;

  bannerImageFile: FileList;
  bannerImageUrl: string;

  logoImageFile: FileList;
  logoImageUrl: string;
}

export interface RoomSchemaShape {
  title: string;
  venueName?: string;
  url?: string;
  useUrl?: boolean;
  image_url: string;
}

const createFileSchema = (
  name: string,
  required: boolean,
  fieldName: string = "Image"
) =>
  Yup.mixed<FileList>()
    .test(
      name,
      `${fieldName} is required!`,
      (val: FileList) => !required || val.length > 0
    )
    .test(
      name,
      `File size limit is 2mb. You can shrink images at ${GIF_RESIZER_URL}`,
      async (val?: FileList) => {
        if (!val || val.length === 0) return true;
        const file = val[0];
        return file.size <= MAX_IMAGE_FILE_SIZE_BYTES;
      }
    );

const urlIfNoFileValidation = (fieldName: string) =>
  Yup.string().when(
    fieldName,
    (file: FileList | undefined, schema: Yup.MixedSchema<FileList>) =>
      file && file.length > 0
        ? schema.notRequired()
        : schema.required("Required")
  );

const mustBeMinimum = (fieldName: string, min: number) =>
  `${fieldName} must be at least ${min} characters`;

export const validationSchema_v2 = Yup.object()
  .shape<SchemaShape>({
    name: Yup.string()
      .required("Name is required!")
      .min(
        VENUE_NAME_MIN_CHAR_COUNT,
        ({ min }) => `Name must be at least ${min} characters`
      )
      .max(
        VENUE_NAME_MAX_CHAR_COUNT,
        ({ max }) => `Name must be less than ${max} characters`
      )
      .when(
        "$editing",
        (editing: boolean, schema: Yup.StringSchema) =>
          !editing
            ? schema
                .test(
                  "name",
                  "Must have alphanumeric characters",
                  (val: string) => createUrlSafeName(val).length > 0
                )
                .test(
                  "name",
                  "This venue name is already taken",
                  async (val: string) =>
                    !val ||
                    !(
                      await firebase
                        .firestore()
                        .collection("venues")
                        .doc(createUrlSafeName(val))
                        .get()
                    ).exists
                )
            : schema //will be set from the data from the api. Does not need to be unique
      ),
    subtitle: Yup.string()
      .required("Subtitle is required!")
      .min(3, ({ min }) => mustBeMinimum("Subtitle", min)),
    description: Yup.string()
      .required("Description is required!")
      .min(3, ({ min }) => mustBeMinimum("Description", min)),

    bannerImageFile: Yup.mixed<FileList>().when("$editing", {
      is: false,
      then: createFileSchema("bannerImageUrl", true, "Banner"),
    }),
    bannerImageUrl: Yup.string().required("Banner is required!"),

    logoImageFile: Yup.mixed<FileList>().when("$editing", {
      is: false,
      then: createFileSchema("logoImageUrl", true, "Logo"),
    }),
    logoImageUrl: Yup.string().required("Logo is required!"),
  })
  .required();

const roomTitleSchema = Yup.string()
  .required("Room name is required")
  .min(
    VENUE_NAME_MIN_CHAR_COUNT,
    ({ min }) => `Name must be at least ${min} characters`
  );

export const roomUrlSchema = Yup.string()
  .required("Url is required!")
  .min(3, ({ min }) => `Url must be at least ${min} characters`)
  .test("url validation", "Please enter a valid URL", isValidUrl);

const roomImageUrlSchema = Yup.string().required("Room image is required");

export const roomCreateSchema = Yup.object().shape<RoomSchemaShape>({
  useUrl: Yup.boolean().required(),
  title: roomTitleSchema,
  venueName: Yup.string()
    .when("useUrl", {
      is: false,
      then: Yup.string()
        .required("Venue name is required")
        .min(
          VENUE_NAME_MIN_CHAR_COUNT,
          ({ min }) => `Name must be at least ${min} characters`
        )
        .max(
          VENUE_NAME_MAX_CHAR_COUNT,
          ({ max }) => `Name must be less than ${max} characters`
        ),
    })
    .when("useUrl", (useUrl: boolean, schema: Yup.StringSchema) =>
      !useUrl
        ? schema
            .test(
              "name",
              "Must have alphanumeric characters",
              (val: string) => createUrlSafeName(val).length > 0
            )
            .test(
              "name",
              "This venue name is already taken",
              async (val: string) =>
                !val ||
                !(
                  await firebase
                    .firestore()
                    .collection("venues")
                    .doc(createUrlSafeName(val))
                    .get()
                ).exists
            )
        : schema
    ),
  url: Yup.string().when("useUrl", {
    is: true,
    then: roomUrlSchema,
  }),
  image_url: roomImageUrlSchema,
});

export const roomEditSchema = Yup.object().shape<RoomSchemaShape>({
  title: roomTitleSchema,
  url: roomUrlSchema,
  image_url: roomImageUrlSchema,
});

// @debt I'm pretty sure every one of these .from that have the same fromKey / toKey are redundant noops and should be removed
export const venueEditSchema = Yup.object()
  .shape<Partial<SchemaShape>>({})
  .from("subtitle", "subtitle")
  .from("config.landingPageConfig.description", "description");

// this is used to transform the api data to conform to the yup schema
// @debt I'm pretty sure every one of these .from that have the same fromKey / toKey are redundant noops and should be removed
export const editVenueCastSchema = Yup.object()
  .shape<Partial<VenueInput>>({})
  // possible locations for the subtitle
  .from("subtitle", "subtitle")
  .from("config.landingPageConfig.subtitle", "subtitle")

  .from("config.landingPageConfig.description", "description")
  .from("profile_questions", "profile_questions")
  .from("host.icon", "logoImageUrl")
  .from("adultContent", "adultContent")
  .from("showGrid", "showGrid")
  .from("columns", "columns")

  // possible locations for the banner image
  .from("config.landingPageConfig.coverImageUrl", "bannerImageUrl")
  .from("config.landingPageConfig.bannerImageUrl", "bannerImageUrl")

  // possible locations for the map icon
  .from("config.mapIconImageUrl", "mapIconImageUrl")
  .from("mapIconImageUrl", "mapIconImageUrl");

// @debt I'm pretty sure every one of these .from that have the same fromKey / toKey are redundant noops and should be removed
export const editPlacementCastSchema = Yup.object()
  .shape<Partial<PlacementInput>>({})

  // possible locations for the map icon
  .from("config.mapIconImageUrl", "mapIconImageUrl")
  .from("mapIconImageUrl", "mapIconImageUrl")
  .from("placement.addressText", "addressText")
  .from("placement.notes", "notes")
  .required();

export const editPlacementSchema = Yup.object().shape<PlacementInput>({
  mapIconImageFile: createFileSchema("mapIconImageFile", false).notRequired(),
  mapIconImageUrl: urlIfNoFileValidation("mapIconImageFile"),
  addressText: Yup.string(),
  notes: Yup.string(),
  width: Yup.number().required("Required"),
  height: Yup.number().required("Required"),
  placement: Yup.object()
    .shape({
      x: Yup.number().required("Required").min(0).max(PLAYA_WIDTH),
      y: Yup.number().required("Required").min(0).max(PLAYA_HEIGHT),
    })
    .default(initialMapIconPlacement),
});

export const eventEditSchema = Yup.object().shape<EventInput>({
  name: Yup.string().required("Name required"),
  description: Yup.string().required("Description required"),
  start_date: Yup.string()
    .required("Start date required")
    .matches(
      /\d{4}-\d{2}-\d{2}/,
      'Start date must have the format "yyyy-mm-dd"'
    )
    .test(
      "start_date_future",
      "Start date must be in the futur",
      (start_date) => {
        return dayjs(start_date).isSameOrAfter(dayjs(), "day");
      }
    ),
  start_time: Yup.string().required("Start time required"),
  duration_hours: Yup.number()
    .typeError("Hours must be a number")
    .required("Hours required"),
  duration_minutes: Yup.number()
    .typeError("Minutes must be a number")
    .required("Minutes equired"),
  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .default(0),
  host: Yup.string().required("Host required"),
  room: Yup.string().matches(/^(?!Select a room...$).*$/, "Room is required"),
});
