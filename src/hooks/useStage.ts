import { useCallback, useEffect, useMemo } from "react";

import { MAX_TALK_SHOW_STUDIO_HOSTS } from "settings";

import { PlaceInTalkShowStudioVenue, User } from "types/User";

import { updateTalkShowStudioExperience } from "api/profile";
import { updateUserTalkShowStudioExperience } from "api/admin";

import { WithId } from "utils/id";
import { isDefined } from "utils/types";

import { useUser } from "hooks/useUser";
import { useRecentVenueUsers } from "hooks/users";

export interface UseStageProps {
  venueId?: string;
}

// @debt Most of the controls here are using firebase to store state/propogate it.. but we didn't need
//   to do any of that for Twilio since the library inherently manages a lot of the state itself.. I wonder
//   if we can simplify this right down by doing similar?
export const useStage = ({ venueId }: UseStageProps) => {
  const { recentVenueUsers } = useRecentVenueUsers();
  const { userId, profile } = useUser();

  const setDefaultUserSettings = useCallback(async () => {
    if (!venueId || !userId) return;

    await updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        isSharingScreen: false,
        place: PlaceInTalkShowStudioVenue.audience,
        isMuted: false,
        isUserCameraOff: false,
      },
    });
  }, [userId, venueId]);

  // @debt we probably shouldn't be using beforeunload here
  useEffect(() => {
    window.addEventListener("beforeunload", setDefaultUserSettings);
    return () => {
      window.removeEventListener("beforeunload", setDefaultUserSettings, false);
    };
  }, [setDefaultUserSettings]);

  const peopleOnStage = useMemo(() => {
    if (!venueId) return [];

    return recentVenueUsers.filter(
      (user) => user.data?.[venueId]?.place === PlaceInTalkShowStudioVenue.stage
    );
  }, [recentVenueUsers, venueId]);

  const peopleRequesting = useMemo(() => {
    if (!venueId) return [];

    return recentVenueUsers.filter(
      (user) =>
        user.data?.[venueId]?.place === PlaceInTalkShowStudioVenue.requesting
    );
  }, [recentVenueUsers, venueId]);

  const isUserRequesting = useMemo(
    () => peopleRequesting.some((user) => user.id === userId),
    [peopleRequesting, userId]
  );

  const isUserOnStage = useMemo(
    () => peopleOnStage.some((user) => user.id === userId),
    [peopleOnStage, userId]
  );

  const canJoinStage = peopleOnStage.length < MAX_TALK_SHOW_STUDIO_HOSTS;

  const screenSharingUser = useMemo(() => {
    if (!venueId) return;

    return peopleOnStage.find((user) => user.data?.[venueId].isSharingScreen);
  }, [peopleOnStage, venueId]);

  const canShareScreen = !isDefined(screenSharingUser);

  const isUserSharing = isDefined(userId) && screenSharingUser?.id === userId;

  const joinStage = useCallback(async () => {
    if (!venueId || !userId) return;

    await updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        place: PlaceInTalkShowStudioVenue.stage,
      },
    });
  }, [userId, venueId]);

  const leaveStage = useCallback(async () => {
    // TODO: clear agoraIds for user when left Stage
    await setDefaultUserSettings();
  }, [setDefaultUserSettings]);

  const requestJoinStage = useCallback(async () => {
    if (!venueId || !userId) return;

    await updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        place: PlaceInTalkShowStudioVenue.requesting,
      },
    });
  }, [userId, venueId]);

  const toggleMicrophone = useCallback(async () => {
    if (!venueId || !userId) return;

    await updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        isMuted: !profile?.data?.[venueId].isMuted,
      },
    });
  }, [profile?.data, userId, venueId]);

  const toggleCamera = useCallback(async () => {
    if (!venueId || !userId) return;

    await updateTalkShowStudioExperience({
      venueId,
      userId,
      experience: {
        isUserCameraOff: !profile?.data?.[venueId].isUserCameraOff,
      },
    });
  }, [profile?.data, userId, venueId]);

  const toggleUserMicrophone = useCallback(
    async (user?: WithId<User>) => {
      if (!user || !venueId) return;

      await updateUserTalkShowStudioExperience(venueId, user.id, {
        isMuted: true,
      });
    },
    [venueId]
  );

  const toggleUserCamera = useCallback(
    async (user?: WithId<User>) => {
      if (!user || !venueId) return;

      await updateUserTalkShowStudioExperience(venueId, user.id, {
        isUserCameraOff: true,
      });
    },
    [venueId]
  );

  const removeUserFromStage = useCallback(
    async (user?: WithId<User>) => {
      if (!user || !venueId) return;

      await updateUserTalkShowStudioExperience(venueId, user.id, {
        place: PlaceInTalkShowStudioVenue.audience,
        isSharingScreen: false,
        isMuted: false,
        isUserCameraOff: false,
      });
    },
    [venueId]
  );

  return {
    peopleOnStage,
    peopleRequesting,
    isUserRequesting,
    screenSharingUser,
    isUserSharing,
    isUserOnStage,
    canJoinStage,
    canShareScreen,
    joinStage,
    leaveStage,
    requestJoinStage,
    toggleMicrophone,
    toggleCamera,
    toggleUserMicrophone,
    toggleUserCamera,
    removeUserFromStage,
  };
};
