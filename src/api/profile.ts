import Bugsnag from "@bugsnag/js";
import firebase from "firebase/app";

import { TalkShowStudioExperience, UserStatus, ProfileLink } from "types/User";
import { VenueEvent } from "types/venues";

import { WithVenueId } from "utils/id";

export const getUserRef = (userId: string) =>
  firebase.firestore().collection("users").doc(userId);

export interface MakeUpdateUserGridLocationProps {
  venueId: string;
  userUid: string;
}

export const makeUpdateUserGridLocation = ({
  venueId,
  userUid,
}: MakeUpdateUserGridLocationProps) => async (
  row: number | null,
  column: number | null
) => {
  const userProfileRef = getUserRef(userUid);
  const doc = await userProfileRef.get();

  if (doc.exists) {
    const userData = doc.data();
    const newData = {
      [`data.${venueId}`]: { ...userData?.data[venueId], row, column },
    };

    userProfileRef.update(newData).catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("api::profile::makeUpdateUserGridLocation", {
          venueId,
          userUid,
          doc,
        });

        throw err;
      });
    });
  } else {
    const newData = {
      [`data.${venueId}`]: {
        row,
        column,
      },
    };

    userProfileRef.set(newData).catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("api::profile::makeUpdateUserGridLocation", {
          venueId,
          userUid,
          doc,
        });

        throw err;
      });
    });
  }
};

export interface UpdateUserOnlineStatusProps {
  status?: UserStatus;
  userId: string;
}

export const updateUserOnlineStatus = async ({
  status,
  userId,
}: UpdateUserOnlineStatusProps): Promise<void> => {
  const userProfileRef = getUserRef(userId);

  const newUserStatusData = {
    status: status ?? firebase.firestore.FieldValue.delete(),
  };

  const context = {
    location: "api/profile::updateUserOnlineStatus",
    status,
    userId,
  };

  return userProfileRef.update(newUserStatusData).catch((err) => {
    Bugsnag.notify(err, (event) => {
      event.addMetadata("context", context);
    });
  });
};

// ================================================= Personalized Schedule
export const addEventToPersonalizedSchedule = ({
  event,
  userId,
}: Omit<UpdatePersonalizedScheduleProps, "removeMode">): Promise<void> =>
  updatePersonalizedSchedule({ event, userId });

export const removeEventFromPersonalizedSchedule = ({
  event,
  userId,
}: Omit<UpdatePersonalizedScheduleProps, "removeMode">): Promise<void> =>
  updatePersonalizedSchedule({ event, userId, removeMode: true });

export interface UpdatePersonalizedScheduleProps {
  event: WithVenueId<VenueEvent>;
  userId: string;
  removeMode?: boolean;
}

export const updatePersonalizedSchedule = async ({
  event,
  userId,
  removeMode = false,
}: UpdatePersonalizedScheduleProps): Promise<void> =>
  updateUserCollection({
    userId,
    removeMode,
    collectionKey: `myPersonalizedSchedule.${event.venueId}`,
    collectionValue: [event.id],
  });

// ================================================= Profile Links
export interface UpdateProfileLinksProps {
  profileLinks: ProfileLink[];
  userId: string;
}

export const updateProfileLinks = async ({
  profileLinks,
  userId,
}: UpdateProfileLinksProps): Promise<void> => {
  const userProfileRef = getUserRef(userId);

  return userProfileRef.update({ profileLinks }).catch((err) => {
    Bugsnag.notify(err, (event) => {
      event.addMetadata("context", {
        location: "api/profile::updateProfileLinks",
        profileLinks,
        userId,
        event,
      });

      throw err;
    });
  });
};

// ================================================= User Collection
export interface UpdateUserCollectionProps {
  collectionKey: string;
  collectionValue: unknown[];
  userId: string;
  removeMode?: boolean;
}

export const updateUserCollection = async ({
  collectionKey,
  collectionValue,
  userId,
  removeMode = false,
}: UpdateUserCollectionProps): Promise<void> => {
  const userProfileRef = getUserRef(userId);

  const modify = removeMode
    ? firebase.firestore.FieldValue.arrayRemove
    : firebase.firestore.FieldValue.arrayUnion;

  const modifiedCollection = {
    [collectionKey]: modify(...collectionValue),
  };

  return userProfileRef.update(modifiedCollection).catch((err) => {
    Bugsnag.notify(err, (event) => {
      event.addMetadata("context", {
        location: "api/profile::updateUserCollectionProps",
        collectionKey,
        collectionValue,
        userId,
        removeMode,
        event,
      });

      throw err;
    });
  });
};

export interface updateTalkShowStudioExperienceProps {
  venueId: string;
  userId: string;
  experience: TalkShowStudioExperience;
}

export const updateTalkShowStudioExperience = async ({
  venueId,
  userId,
  experience,
}: updateTalkShowStudioExperienceProps) => {
  const userProfileRef = getUserRef(userId);

  const userData = (await userProfileRef.get()).data();

  const newData = {
    [`data.${venueId}`]: { ...userData?.data?.[venueId], ...experience },
  };

  userProfileRef.update(newData).catch((err) => {
    Bugsnag.notify(err, (event) => {
      event.addMetadata("context", {
        location: "api/profile::updateTalkShowStudioExperience",
        venueId,
        userId,
        event,
        experience,
      });

      throw err;
    });
  });
};

export interface UpdateUserIdsProps {
  venueId: string;
  userId: string;
  // TODO: unify updateUserIds, updateScreenShareStatus and updatePlaceInRoom methods into one
  props: Record<string, string | number>;
}

export const updateUserIds = async ({
  venueId,
  userId,
  props,
}: UpdateUserIdsProps) => {
  const userProfileRef = getUserRef(userId);

  const userData = (await userProfileRef.get()).data();

  const newData = {
    [`data.${venueId}`]: { ...userData?.data[venueId], ...props },
  };

  userProfileRef.update(newData).catch((err) => {
    Bugsnag.notify(err, (event) => {
      event.addMetadata("context", {
        location: "api/profile::updateUserIds",
        venueId,
        userId,
        event,
        ...props,
      });

      throw err;
    });
  });
};
