import { useMemo, useCallback } from "react";
import { FirebaseReducer } from "react-redux-firebase";
import { isEqual } from "lodash";
import firebase from "firebase/app";

import { updateUserCache } from "store/actions/Cache";

import { User, UserWithLocation } from "types/User";

import { withId, WithId } from "utils/id";
import { authSelector, profileSelector } from "utils/selectors";

import { useSelector } from "hooks/useSelector";
import { useDispatch } from "./useDispatch";

export interface UseUserResult {
  user?: FirebaseReducer.AuthState;
  profile?: FirebaseReducer.Profile<User>;
  userWithId?: WithId<User>;
  userId?: string;
}

export const useUser = (): UseUserResult => {
  const auth = useSelector(authSelector, isEqual);
  const profile = useSelector(profileSelector, isEqual);

  return useMemo(
    () => ({
      user: !auth.isEmpty ? auth : undefined,
      profile: !profile.isEmpty ? profile : undefined,
      userWithId: auth && profile ? withId(profile, auth.uid) : undefined,
      userId: auth && profile ? auth.uid : undefined,
    }),
    [auth, profile]
  );
};

// @debt Remove, once the proper user fix is merged in
export const useUserInvalidateCache = (id: string | undefined) => {
  const dispatch = useDispatch();

  const invalidateUserCache = useCallback(() => {
    if (!id) return;

    firebase
      .firestore()
      .collection("users")
      .doc(id)
      .get()
      .then((doc: firebase.firestore.DocumentSnapshot) => {
        const user: UserWithLocation = doc.data() as UserWithLocation;

        const updateAction = updateUserCache(id, withId(user, doc.id));
        dispatch(updateAction);
      });
  }, [id, dispatch]);

  return {
    invalidateUserCache,
  };
};
