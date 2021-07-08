import React, { useMemo } from "react";
import classNames from "classnames";

import { DEFAULT_PARTY_NAME, DEFAULT_PROFILE_IMAGE } from "settings";

import { User, UsernameVisibility } from "types/User";
import { useRecentUserStatus, useRecentWorldUsers } from "hooks/users";

import { WithId } from "utils/id";

import "./UserAvatar.scss";

export interface UserAvatarProps {
  user?: WithId<User>;
  containerClassName?: string;
  imageClassName?: string;
  showNametag?: UsernameVisibility;
  showStatus?: boolean;
  onClick?: () => void;
  large?: boolean;
  medium?: boolean;
}

// @debt the UserProfilePicture component serves a very similar purpose to this, we should unify them as much as possible
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  containerClassName,
  imageClassName,
  showNametag,
  onClick,
  showStatus,
  large,
  medium,
}) => {
  const { recentWorldUsers } = useRecentWorldUsers();

  const avatarSrc: string = user?.anonMode
    ? DEFAULT_PROFILE_IMAGE
    : user?.pictureUrl ?? DEFAULT_PROFILE_IMAGE;

  const userDisplayName: string = user?.anonMode
    ? DEFAULT_PARTY_NAME
    : user?.partyName ?? DEFAULT_PARTY_NAME;

  const containerClasses = classNames("UserAvatar", containerClassName, {
    "UserAvatar--clickable": onClick !== undefined,
    "UserAvatar--large": large,
    "UserAvatar--medium": medium,
  });

  const isOnline = useMemo(
    () => recentWorldUsers.find((worldUser) => worldUser.id === user?.id),
    [user, recentWorldUsers]
  );

  const status = useRecentUserStatus(user);

  const nametagClasses = classNames("UserAvatar__nametag", {
    "UserAvatar__nametag--hover": showNametag === UsernameVisibility.hover,
  });

  const imageClasses = classNames("UserAvatar__image", imageClassName);

  const statusIndicatorClasses = classNames("UserAvatar__status-indicator", {
    "UserAvatar__status-indicator--online": isOnline,
    [`UserAvatar__status-indicator--${status}`]: isOnline && status,
    "UserAvatar__status-indicator--large": large,
  });

  return (
    <div className={containerClasses}>
      {showNametag && <div className={nametagClasses}>{user?.partyName}</div>}
      <img
        className={imageClasses}
        src={avatarSrc}
        alt={`${userDisplayName}'s avatar`}
        onClick={onClick}
      />
      {showStatus && <span className={statusIndicatorClasses} />}
    </div>
  );
};
