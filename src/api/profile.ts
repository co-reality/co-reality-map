import Bugsnag from "@bugsnag/js";
import firebase from "firebase/app";
import { ProfileLink, UserStatus } from "types/User";

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
}: MakeUpdateUserGridLocationProps) => (
  row: number | null,
  column: number | null
) => {
  const doc = `users/${userUid}`;

  const newData = {
    [`data.${venueId}`]: {
      row,
      column,
    },
  };

  const firestore = firebase.firestore();

  // @debt refactor this to use a proper upsert pattern instead of error based try/catch logic
  firestore
    .doc(doc)
    .update(newData)
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.severity = "info";

        event.addMetadata(
          "notes",
          "TODO",
          "refactor this to use a proper upsert pattern (eg. check that the doc exists, then insert or update accordingly), rather than using try/catch"
        );

        event.addMetadata("api::profile::makeUpdateUserGridLocation", {
          venueId,
          userUid,
          doc,
        });
      });

      firestore.doc(doc).set(newData);
    });
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

// ================================================= Contacts List
export interface UpdateContactsListProps {
  contactsListUserId: string;
  userId: string;
}

export const addToContactsList = async ({
  contactsListUserId,
  userId,
}: UpdateContactsListProps): Promise<void> => {
  const userProfileRef = getUserRef(userId);

  return userProfileRef
    .update({
      contactsList: firebase.firestore.FieldValue.arrayUnion(
        contactsListUserId
      ),
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/profile::updateProfileLinks",
          contactsListUserId,
          userId,
          event,
        });

        throw err;
      });
    });
};

export const removeFromContactsList = async ({
  contactsListUserId,
  userId,
}: UpdateContactsListProps): Promise<void> => {
  const userProfileRef = getUserRef(userId);

  return userProfileRef
    .update({
      contactsList: firebase.firestore.FieldValue.arrayRemove(
        contactsListUserId
      ),
    })
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/profile::updateProfileLinks",
          contactsListUserId,
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
