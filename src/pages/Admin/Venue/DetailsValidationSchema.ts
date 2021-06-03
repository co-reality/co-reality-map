import { createUrlSafeName, VenueInput, PlacementInput } from "api/admin";
import firebase from "firebase/app";
import "firebase/functions";
import * as Yup from "yup";

import {
  ZOOM_URL_TEMPLATES,
  IFRAME_TEMPLATES,
  PLAYA_VENUE_SIZE,
  MAX_IMAGE_FILE_SIZE_BYTES,
  GIF_RESIZER_URL,
  PLAYA_WIDTH,
  PLAYA_HEIGHT,
  MAX_IMAGE_FILE_SIZE_TEXT,
  BACKGROUND_IMG_TEMPLATES,
  MINIMUM_COLUMNS,
  MAXIMUM_COLUMNS,
  VENUE_NAME_MAX_CHAR_COUNT,
  VENUE_NAME_MIN_CHAR_COUNT,
} from "settings";

import { VenueTemplate } from "types/venues";

const initialMapIconPlacement: VenueInput["placement"] = {
  x: (PLAYA_WIDTH - PLAYA_VENUE_SIZE) / 2,
  y: (PLAYA_HEIGHT - PLAYA_VENUE_SIZE) / 2,
};

type ProfileQuestion = VenueInput["profile_questions"][number];
type CodeOfConductQuestion = VenueInput["code_of_conduct_questions"][number];

const createFileSchema = (name: string, required: boolean) =>
  Yup.mixed<FileList>()
    .test(
      name,
      "Image required",
      (val: FileList) => !required || val.length > 0
    )
    .test(
      name,
      `File size limit is ${MAX_IMAGE_FILE_SIZE_TEXT}. You can shrink images at ${GIF_RESIZER_URL}`,
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

export const validationSchema = Yup.object()
  .shape<VenueInput>({
    template: Yup.mixed<VenueTemplate>().required(),
    name: Yup.string()
      .required("Venue name is required")
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
    bannerImageFile: createFileSchema("bannerImageFile", false).notRequired(), // override files to make them non required
    logoImageFile: createFileSchema("logoImageFile", false).notRequired(),

    showGrid: Yup.bool().notRequired(),
    columns: Yup.number().when("showGrid", {
      is: true,
      then: Yup.number()
        .required(
          `The columns need to be between ${MINIMUM_COLUMNS} and ${MAXIMUM_COLUMNS}.`
        )
        .min(MINIMUM_COLUMNS)
        .max(MAXIMUM_COLUMNS),
    }),

    mapBackgroundImageUrl: Yup.string().when(
      "$template.template",
      (template: VenueTemplate, schema: Yup.StringSchema) =>
        BACKGROUND_IMG_TEMPLATES.includes(template)
          ? urlIfNoFileValidation("mapBackgroundImageFile")
          : schema.notRequired()
    ),

    attendeesTitle: Yup.string().notRequired().default("Guests"),
    chatTitle: Yup.string().notRequired().default("Party"),

    bannerImageUrl: urlIfNoFileValidation("bannerImageFile"),
    logoImageUrl: urlIfNoFileValidation("logoImageFile"),
    description: Yup.string().required("Description required"),
    subtitle: Yup.string().required("Subtitle required"),
    zoomUrl: Yup.string().when(
      "$template.template",
      (template: VenueTemplate, schema: Yup.MixedSchema<FileList>) =>
        ZOOM_URL_TEMPLATES.includes(template)
          ? schema
              .required("Required")
              .test("zoomUrl", "URL required", (val: string) => val.length > 0)
          : schema.notRequired()
    ),
    iframeUrl: Yup.string().when(
      "$template.template",
      (template: VenueTemplate, schema: Yup.MixedSchema<FileList>) =>
        IFRAME_TEMPLATES.includes(template)
          ? schema
              .required("Required")
              .test(
                "iframeUrl",
                "Video URL required",
                (val: string) => val.length > 0
              )
          : schema.notRequired()
    ),

    width: Yup.number().notRequired().min(0).max(PLAYA_WIDTH),
    height: Yup.number().notRequired().min(0).max(PLAYA_HEIGHT),

    placement: Yup.object()
      .shape({
        x: Yup.number().required("Required").min(0).max(PLAYA_WIDTH),
        y: Yup.number().required("Required").min(0).max(PLAYA_HEIGHT),
      })
      .default(initialMapIconPlacement),

    // @debt provide some validation error messages for invalid questions
    // advanced options
    profile_questions: Yup.array<ProfileQuestion>()
      .ensure()
      .defined()
      .transform((val: Array<ProfileQuestion>) =>
        val.filter((s) => !!s.name && !!s.text)
      ), // ensure questions are not empty strings

    code_of_conduct_questions: Yup.array<CodeOfConductQuestion>()
      .ensure()
      .defined()
      .transform((val: Array<CodeOfConductQuestion>) =>
        val.filter((s) => !!s.name && !!s.text)
      ),

    showRadio: Yup.bool().notRequired(),
    radioStations: Yup.string().when("showRadio", {
      is: true,
      then: Yup.string().required("Radio station (stream) is required!"),
    }),

    owners: Yup.array<string>().notRequired(),
    placementRequests: Yup.string().notRequired(),
    adultContent: Yup.bool().required(),
    bannerMessage: Yup.string().notRequired(),
    parentId: Yup.string().notRequired(),
    showReactions: Yup.bool().notRequired(),
    auditoriumColumns: Yup.number()
      .notRequired()
      .min(5, "Columns must be at least 5"),
    auditoriumRows: Yup.number()
      .notRequired()
      .min(5, "Rows must be at least 5"),
  })
  .required();

// this is used to transform the api data to conform to the yup schema
export const editVenueCastSchema = Yup.object()
  .shape<Partial<VenueInput>>({})
  // possible locations for the subtitle
  .from("subtitle", "subtitle")
  .from("config.landingPageConfig.subtitle", "subtitle")

  .from("config.landingPageConfig.description", "description")
  .from("profile_questions", "profileQuestions")
  .from("host.icon", "logoImageUrl")
  .from("adultContent", "adultContent")
  .from("showGrid", "showGrid")
  .from("showReactions", "showReactions")
  .from("columns", "columns")
  .from("attendeesTitle", "attendeesTitle")
  .from("chatTitle", "chatTitle")

  // possible locations for the banner image
  .from("config.landingPageConfig.coverImageUrl", "bannerImageUrl")
  .from("config.landingPageConfig.bannerImageUrl", "bannerImageUrl")

  // possible locations for the map icon
  .from("auditoriumColumns", "auditoriumColumns")
  .from("auditoriumRows", "auditoriumRows")
  .from("code_of_conduct_questions", "code_of_conduct_questions")
  .from("profile_questions", "profile_questions");

export const editPlacementCastSchema = Yup.object()
  .shape<Partial<PlacementInput>>({})

  // possible locations for the map icon
  .from("placement.addressText", "addressText")
  .from("placement.notes", "notes")
  .required();

export const editPlacementSchema = Yup.object().shape<PlacementInput>({
  mapIconImageFile: createFileSchema("mapIconImageFile", false).notRequired(),
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
