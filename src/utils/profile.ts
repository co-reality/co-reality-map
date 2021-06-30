import firebase from "firebase/app";
import { FirebaseReducer } from "react-redux-firebase";
import { User, RecentUserStatusType } from "types/User";
import { WithId } from "utils/id";
import { isTruthy } from "./types";

export const updateProfileEnteredVenueIds = async (
  prevEnteredVenueIds: readonly string[] | undefined,
  userId: string | undefined,
  venueId: string
) => {
  const enteredVenueIds = prevEnteredVenueIds ? [...prevEnteredVenueIds] : [];
  if (!enteredVenueIds.includes(venueId)) {
    enteredVenueIds.push(venueId);
    await firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .update({ enteredVenueIds });
  }
};

export const getUserDisplayStatus = (
  user?: WithId<User>
): RecentUserStatusType => {
  if (user?.status === RecentUserStatusType.busy)
    return RecentUserStatusType.busy;

  if (user?.status === RecentUserStatusType.incognito)
    return RecentUserStatusType.incognito;

  return user ? RecentUserStatusType.online : RecentUserStatusType.offline;
};

export const isCompleteProfile = (profile: FirebaseReducer.Profile<User>) =>
  isTruthy(profile.partyName) && isTruthy(profile.pictureUrl);

export const getUserCurrentLocation = (user?: WithId<User>) => {
  if (!user?.lastSeenIn) {
    return undefined;
  }

  return Object.keys(user.lastSeenIn)[0];
};
