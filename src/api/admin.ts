import firebase, { UserInfo } from "firebase/app";
import { omit } from "lodash";
import Bugsnag from "@bugsnag/js";

import { Room } from "types/rooms";
import {
  VenueEvent,
  VenuePlacement,
  VenueTemplate,
  Venue_v2_AdvancedConfig,
  Venue_v2_EntranceConfig,
} from "types/venues";
import { RoomData_v2 } from "types/rooms";
import { UsernameVisibility } from "types/User";

import { venueInsideUrl } from "utils/url";
import { WithId } from "utils/id";
import { UserStatus } from "types/User";

export interface EventInput {
  name: string;
  description: string;
  start_date: string;
  start_time: string;
  duration_hours: number;
  host: string;
  room?: string;
}

interface Question {
  name: string;
  text: string;
  link?: string;
}

export interface AdvancedVenueInput {
  profile_questions: Array<Question>;
  code_of_conduct_questions: Array<Question>;
}

type VenueImageFileKeys =
  | "bannerImageFile"
  | "logoImageFile"
  | "mapIconImageFile"
  | "mapBackgroundImageFile";

type VenueImageUrlKeys =
  | "bannerImageUrl"
  | "logoImageUrl"
  | "mapIconImageUrl"
  | "mapBackgroundImageUrl";

type ImageFileKeys =
  | "bannerImageFile"
  | "logoImageFile"
  | "mapBackgroundImageFile";

type ImageUrlKeys = "bannerImageUrl" | "logoImageUrl" | "mapBackgroundImageUrl";

type RoomImageFileKeys = "image_file";
type RoomImageUrlKeys = "image_url";

type VenueImageUrls = Partial<Record<VenueImageUrlKeys, string>>;
type RoomImageUrls = Partial<Record<RoomImageUrlKeys, string>>;

export type RoomInput = Omit<Room, "image_url"> & {
  image_url?: string;
  image_file?: FileList;
};

export type RoomInput_v2 = RoomData_v2 & {
  venueName?: string;
  useUrl?: boolean;
  image_url?: string;
  image_file?: FileList;
};

export type VenueInput = AdvancedVenueInput &
  VenueImageUrls & {
    name: string;
    bannerImageFile?: FileList;
    logoImageFile?: FileList;
    mapIconImageFile?: FileList;
    mapBackgroundImageFile?: FileList;
    subtitle: string;
    description: string;
    zoomUrl?: string;
    iframeUrl?: string;
    template: VenueTemplate;
    rooms?: Array<Room>;
    placement?: Omit<VenuePlacement, "state">;
    placementRequests?: string;
    adultContent: boolean;
    showGrid?: boolean;
    columns?: number;
    width?: number;
    height?: number;
    bannerMessage?: string;
    parentId?: string;
    owners?: string[];
    showRangers?: boolean;
    chatTitle?: string;
    attendeesTitle?: string;
    auditoriumRows?: number;
    auditoriumColumns?: number;
    userStatuses?: UserStatus[];
    showReactions?: boolean;
    showShoutouts?: boolean;
    showRadio?: boolean;
    radioStations?: string;
    showNametags?: UsernameVisibility;
    showUserStatus?: boolean;
  };

export interface VenueInput_v2
  extends Venue_v2_AdvancedConfig,
    Venue_v2_EntranceConfig {
  name: string;
  description?: string;
  subtitle?: string;
  bannerImageFile?: FileList;
  bannerImageUrl?: string;
  logoImageFile?: FileList;
  logoImageUrl?: string;
  rooms?: Room[];
  mapBackgroundImageFile?: FileList;
  mapBackgroundImageUrl?: string;
  template?: VenueTemplate;
  iframeUrl?: string;
}

type FirestoreVenueInput = Omit<VenueInput, VenueImageFileKeys> &
  VenueImageUrls;

type FirestoreVenueInput_v2 = Omit<VenueInput_v2, ImageFileKeys> &
  Partial<Record<ImageUrlKeys, string>> & {
    template: VenueTemplate;
  };

type FirestoreRoomInput = Omit<RoomInput, RoomImageFileKeys> & RoomImageUrls;

type FirestoreRoomInput_v2 = Omit<RoomInput_v2, RoomImageFileKeys> &
  RoomImageUrls & {
    url?: string;
  };

export type PlacementInput = {
  mapIconImageFile?: FileList;
  mapIconImageUrl?: string;
  addressText?: string;
  notes?: string;
  placement?: Omit<VenuePlacement, "state">;
  width: number;
  height: number;
};

// add a random prefix to the file name to avoid overwriting a file, which invalidates the previous downloadURLs
const randomPrefix = () => Math.random().toString();

export const createUrlSafeName = (name: string) =>
  name.replace(/\W/g, "").toLowerCase();

export const getVenueOwners = async (venueId: string): Promise<string[]> => {
  const owners = (
    await firebase.firestore().collection("venues").doc(venueId).get()
  ).data()?.owners;

  return owners;
};

const createFirestoreVenueInput = async (input: VenueInput, user: UserInfo) => {
  const storageRef = firebase.storage().ref();

  const urlVenueName = createUrlSafeName(input.name);
  type ImageNaming = {
    fileKey: VenueImageFileKeys;
    urlKey: VenueImageUrlKeys;
  };
  const imageKeys: Array<ImageNaming> = [
    {
      fileKey: "logoImageFile",
      urlKey: "logoImageUrl",
    },
    {
      fileKey: "bannerImageFile",
      urlKey: "bannerImageUrl",
    },
    {
      fileKey: "mapIconImageFile",
      urlKey: "mapIconImageUrl",
    },
    {
      fileKey: "mapBackgroundImageFile",
      urlKey: "mapBackgroundImageUrl",
    },
  ];

  let imageInputData = {};

  // upload the files
  for (const entry of imageKeys) {
    const fileArr = input[entry.fileKey];
    if (!fileArr || fileArr.length === 0) continue;
    const file = fileArr[0];

    // add a random prefix to the file name to avoid overwriting a file, which invalidates the previous downloadURLs
    const randomPrefix = Math.random().toString();

    const uploadFileRef = storageRef.child(
      `users/${user.uid}/venues/${urlVenueName}/${randomPrefix}-${file.name}`
    );

    await uploadFileRef.put(file);
    const downloadUrl: string = await uploadFileRef.getDownloadURL();

    imageInputData = {
      ...imageInputData,
      [entry.urlKey]: downloadUrl,
    };
  }

  let owners: string[] = [];
  if (input.parentId) {
    owners = await getVenueOwners(input.parentId);
  }

  const firestoreVenueInput: FirestoreVenueInput = {
    ...omit(
      input,
      imageKeys.map((entry) => entry.fileKey)
    ),
    owners,
    ...imageInputData,
    rooms: [], // eventually we will be getting the rooms from the form
  };

  return firestoreVenueInput;
};

const createFirestoreVenueInput_v2 = async (
  input: VenueInput_v2,
  user: UserInfo
) => {
  const storageRef = firebase.storage().ref();

  const urlVenueName = createUrlSafeName(input.name);
  type ImageNaming = {
    fileKey: ImageFileKeys;
    urlKey: ImageUrlKeys;
  };
  const imageKeys: Array<ImageNaming> = [
    {
      fileKey: "logoImageFile",
      urlKey: "logoImageUrl",
    },
    {
      fileKey: "bannerImageFile",
      urlKey: "bannerImageUrl",
    },
    {
      fileKey: "mapBackgroundImageFile",
      urlKey: "mapBackgroundImageUrl",
    },
  ];

  let imageInputData = {};

  // upload the files
  for (const entry of imageKeys) {
    const fileArr = input[entry.fileKey];
    if (!fileArr || fileArr.length === 0) continue;
    const file = fileArr[0];

    const uploadFileRef = storageRef.child(
      `users/${user.uid}/venues/${urlVenueName}/${randomPrefix()}-${file.name}`
    );

    await uploadFileRef.put(file);
    const downloadUrl: string = await uploadFileRef.getDownloadURL();

    imageInputData = {
      ...imageInputData,
      [entry.urlKey]: downloadUrl,
    };
  }

  const firestoreVenueInput: FirestoreVenueInput_v2 = {
    ...omit(
      input,
      imageKeys.map((entry) => entry.fileKey)
    ),
    ...imageInputData,
    template: input.template ?? VenueTemplate.partymap,
  };

  return firestoreVenueInput;
};

export const createVenue = async (input: VenueInput, user: UserInfo) => {
  const firestoreVenueInput = await createFirestoreVenueInput(input, user);
  return await firebase.functions().httpsCallable("venue-createVenue")(
    firestoreVenueInput
  );
};

export const createVenue_v2 = async (input: VenueInput_v2, user: UserInfo) => {
  const firestoreVenueInput = await createFirestoreVenueInput_v2(
    {
      ...input,
      rooms: [],
    },
    user
  );
  return await firebase.functions().httpsCallable("venue-createVenue_v2")(
    firestoreVenueInput
  );
};

export const updateVenue = async (
  input: WithId<VenueInput>,
  user: UserInfo
) => {
  const firestoreVenueInput = await createFirestoreVenueInput(input, user);

  return await firebase.functions().httpsCallable("venue-updateVenue")(
    firestoreVenueInput
  );
};

export const updateVenue_v2 = async (input: VenueInput_v2, user: UserInfo) => {
  const firestoreVenueInput = await createFirestoreVenueInput_v2(input, user);

  return firebase
    .functions()
    .httpsCallable("venue-updateVenue_v2")(firestoreVenueInput)
    .catch((error) => {
      const msg = `[updateVenue_v2] updating venue ${input.name}`;
      const context = {
        location: "api/admin::updateVenue_v2",
      };

      Bugsnag.notify(msg, (event) => {
        event.severity = "warning";
        event.addMetadata("context", context);
        event.addMetadata("firestoreVenueInput", firestoreVenueInput);
      });
      throw error;
    });
};

const createFirestoreRoomInput = async (
  input: RoomInput,
  venueId: string,
  user: UserInfo
) => {
  const storageRef = firebase.storage().ref();

  const urlRoomName = createUrlSafeName(
    input.title + Math.random().toString() //room titles are not necessarily unique
  );
  type ImageNaming = {
    fileKey: RoomImageFileKeys;
    urlKey: RoomImageUrlKeys;
  };
  const imageKeys: Array<ImageNaming> = [
    {
      fileKey: "image_file",
      urlKey: "image_url",
    },
  ];

  let imageInputData = {};

  // upload the files
  for (const entry of imageKeys) {
    const fileArr = input[entry.fileKey];
    if (!fileArr || fileArr.length === 0) continue;
    const file = fileArr[0];
    const uploadFileRef = storageRef.child(
      `users/${user.uid}/venues/${venueId}/${urlRoomName}/${file.name}`
    );

    await uploadFileRef.put(file);
    const downloadUrl: string = await uploadFileRef.getDownloadURL();
    imageInputData = { ...imageInputData, [entry.urlKey]: downloadUrl };
  }

  const firestoreRoomInput: FirestoreRoomInput = {
    ...omit(
      input,
      imageKeys.map((entry) => entry.fileKey)
    ),
    ...imageInputData,
  };
  return firestoreRoomInput;
};

const createFirestoreRoomInput_v2 = async (
  input: RoomInput_v2,
  venueId: string,
  user: UserInfo
) => {
  const storageRef = firebase.storage().ref();

  const urlRoomName = createUrlSafeName(
    input.title + Math.random().toString() //room titles are not necessarily unique
  );
  type ImageNaming = {
    fileKey: RoomImageFileKeys;
    urlKey: RoomImageUrlKeys;
  };
  const imageKeys: Array<ImageNaming> = [
    {
      fileKey: "image_file",
      urlKey: "image_url",
    },
  ];

  let imageInputData = {};

  // upload the files
  for (const entry of imageKeys) {
    const fileArr = input[entry.fileKey];
    if (!fileArr || fileArr.length === 0) continue;
    const file = fileArr[0];
    const uploadFileRef = storageRef.child(
      `users/${user.uid}/venues/${venueId}/${urlRoomName}/${file.name}`
    );

    await uploadFileRef.put(file);
    const downloadUrl: string = await uploadFileRef.getDownloadURL();
    imageInputData = { ...imageInputData, [entry.urlKey]: downloadUrl };
  }

  const firestoreRoomInput: FirestoreRoomInput_v2 = {
    ...omit(
      input,
      imageKeys.map((entry) => entry.fileKey)
    ),
    url:
      input.useUrl || !input.venueName
        ? input.url
        : window.origin + venueInsideUrl(input.venueName!),
    ...imageInputData,
  };

  return firestoreRoomInput;
};

export const upsertRoom = async (
  input: RoomInput,
  venueId: string,
  user: UserInfo,
  roomIndex?: number
) => {
  const firestoreVenueInput = await createFirestoreRoomInput(
    input,
    venueId,
    user
  );

  return await firebase.functions().httpsCallable("venue-upsertRoom")({
    venueId,
    roomIndex,
    room: firestoreVenueInput,
  });
};

export const updateRoom = async (
  input: RoomInput_v2,
  venueId: string,
  user: UserInfo,
  roomIndex: number
) => {
  const firestoreVenueInput = await createFirestoreRoomInput_v2(
    input,
    venueId,
    user
  );

  return await firebase.functions().httpsCallable("venue-upsertRoom")({
    venueId,
    roomIndex,
    room: firestoreVenueInput,
  });
};

export const bulkUpdateRooms = async (
  venueId: string,
  user: UserInfo,
  rooms: RoomInput_v2[]
) => {
  const test = rooms.map((firestoreVenueInput, index) => {
    return firebase.functions().httpsCallable("venue-upsertRoom")({
      venueId,
      index,
      room: firestoreVenueInput,
    });
  });

  return Promise.all(test);
};

export const createRoom = async (
  input: RoomInput_v2,
  venueId: string,
  user: UserInfo
) => {
  const firestoreVenueInput = await createFirestoreRoomInput_v2(
    input,
    venueId,
    user
  );

  return await firebase.functions().httpsCallable("venue-upsertRoom")({
    venueId,
    room: {
      ...firestoreVenueInput,
      // Initial positions and size
      // TODO: As an alternative to the center positioning, maybe have a Math.random() to place rooms at random
      x_percent: 50,
      y_percent: 50,
      width_percent: 5,
      height_percent: 5,
    },
  });
};

export const createEvent = async (venueId: string, event: VenueEvent) => {
  await firebase.firestore().collection(`venues/${venueId}/events`).add(event);
};

export const updateEvent = async (
  venueId: string,
  eventId: string,
  event: VenueEvent
) => {
  await firebase
    .firestore()
    .doc(`venues/${venueId}/events/${eventId}`)
    .update(event);
};

export const deleteEvent = async (venueId: string, eventId: string) => {
  await firebase
    .firestore()
    .collection(`venues/${venueId}/events`)
    .doc(eventId)
    .delete();
};

export const addVenueOwner = async (venueId: string, newOwnerId: string) =>
  await firebase.functions().httpsCallable("venue-addVenueOwner")({
    venueId,
    newOwnerId,
  });

export const removeVenueOwner = async (venueId: string, ownerId: string) =>
  firebase.functions().httpsCallable("venue-removeVenueOwner")({
    venueId,
    ownerId,
  });
