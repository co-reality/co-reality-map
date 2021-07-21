import { useMemo } from "react";
import { FirebaseReducer } from "react-redux-firebase";
import { isEqual } from "lodash";

import { RootState } from "store";

import { User } from "types/User";

import { withId, WithId } from "utils/id";
import { authSelector, profileSelector } from "utils/selectors";

import { useSelector } from "hooks/useSelector";

export interface UseUserResult {
  user?: FirebaseReducer.AuthState;
  profile?: FirebaseReducer.Profile<User>;
  userWithId?: WithId<User>;
  userId?: string;
}

export const useUser = (): UseUserResult => {
  const auth = useSelector((state: RootState) => {
    const auth = authSelector(state);

    return !auth.isEmpty ? auth : undefined;
  }, isEqual);

  const profile = useSelector((state: RootState) => {
    const profile = profileSelector(state);

    return !profile.isEmpty ? profile : undefined;
  }, isEqual);

  const userId = auth?.uid;

  const userWithId = useMemo(() => {
    if (!userId || !profile) return;

    return withId(profile, userId);
  }, [profile, userId]);

  return useMemo(
    () => ({
      user: auth,
      profile,
      userWithId,
      userId,
    }),
    [auth, profile, userId, userWithId]
  );
};
