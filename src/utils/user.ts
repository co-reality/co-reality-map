import { Experience, User } from "types/User";

export const getUserExperience = (venueName?: string) => (
  user?: User
): Experience | undefined => {
  if (!venueName || !user) return;

  return user?.data?.[venueName];
};

export const isCompleteUser = (user: User) => {
  return user.partyName && user.pictureUrl;
};
