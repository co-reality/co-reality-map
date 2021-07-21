import firebase from "firebase/app";

import { updateUserProfile } from "pages/Account/helpers";
import { useInterval } from "hooks/useInterval";

import { LOCATION_INCREMENT_MS, LOCATION_INCREMENT_SECONDS } from "settings";

import { getCurrentTimeInMilliseconds } from "./time";
import { openRoomUrl } from "./url";

export type LocationData = Record<string, number>;

export interface UpdateLocationDataProps {
  userId: string;
  newLocationData: LocationData;
}

export const updateLocationData = ({
  userId,
  newLocationData,
}: UpdateLocationDataProps) => {
  updateUserProfile(userId, {
    lastSeenAt: getCurrentTimeInMilliseconds(),
    lastSeenIn: newLocationData,
  });
};

export interface SetLocationDataProps {
  userId: string;
  locationName: string;
}

// TODO: refactor how user location updates works here?
//   Called from VenuePage useEffect when venue changes, etc
export const setLocationData = ({
  userId,
  locationName,
}: SetLocationDataProps) => {
  updateLocationData({
    userId,
    newLocationData: {
      [locationName]: getCurrentTimeInMilliseconds(),
    },
  });
};

export interface UpdateCurrentLocationDataProps {
  userId: string;
  profileLocationData: LocationData;
}

// NOTE: The intended effect is to update the current location, without rewriting it.
// profileLocationData can only have 1 key at any point of time
// TODO: refactor how user location updates works here?
//   Called from VenuePage interval
export const updateCurrentLocationData = ({
  userId,
  profileLocationData,
}: UpdateCurrentLocationDataProps) => {
  const [locationName] = Object.keys(profileLocationData);

  updateLocationData({
    userId,
    newLocationData: { [locationName]: getCurrentTimeInMilliseconds() },
  });
};

// TODO: refactor how user location updates works here?
//   Called from VenuePage useEffect + onBeforeUnloadHandler
export const clearLocationData = (userId: string) => {
  updateLocationData({ userId, newLocationData: {} });
};

export interface EnterExternalRoomProps {
  userId: string;
  roomUrl: string;
  locationName: string;
}

export const enterExternalRoom = ({
  userId,
  locationName,
  roomUrl,
}: EnterExternalRoomProps) => {
  setLocationData({
    userId,
    locationName,
  });

  openRoomUrl(roomUrl);
};

export interface UseUpdateTimespentPeriodicallyProps {
  locationName: string;
  userId?: string;
}

// @debt I don't think this functionality works correctly, since we only log 'internal venues' in this piece of code
//   Could also be beneficial to log external rooms' timespent
export const useUpdateTimespentPeriodically = ({
  locationName,
  userId,
}: UseUpdateTimespentPeriodicallyProps) => {
  const shouldUseInterval = userId && locationName;

  useInterval(
    () => {
      // @debt time spent is currently counted multiple times if multiple tabs are open
      if (!userId || !locationName) return;

      const firestore = firebase.firestore();
      const locationRef = firestore
        .collection("users")
        .doc(userId)
        .collection("visits")
        .doc(locationName);

      return locationRef
        .update({
          timeSpent: firebase.firestore.FieldValue.increment(
            LOCATION_INCREMENT_SECONDS
          ),
        })
        .catch(() => {
          /*
            NOTE: it's (intended to be) because there was no document to update,
            and so we are defaulting it to LOCATION_INCREMENT_SECONDS
            since that's how often this code runs
          */
          locationRef.set({ timeSpent: LOCATION_INCREMENT_SECONDS });
        });
    },
    shouldUseInterval ? LOCATION_INCREMENT_MS : undefined
  );
};
