import React, { useMemo } from "react";
import classNames from "classnames";
import { isEqual } from "lodash";

import { DEFAULT_PARTY_NAME, DEFAULT_PROFILE_IMAGE } from "settings";

import { User, UsernameVisibility } from "types/User";

import { WithId } from "utils/id";

import { useRecentWorldUsers } from "hooks/users";
import { useVenueUserStatuses } from "hooks/useVenueUserStatuses";
import { useVenueId } from "hooks/useVenueId";

import "./UserAvatar.scss";
import { useImage } from "hooks/useImage";
import { useState } from "react";
import { useEffect } from "react";

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
export const _UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  containerClassName,
  imageClassName,
  showNametag,
  onClick,
  showStatus,
  large,
  medium,
}) => {
  const [userAvatar, updateUserAvatar] = useState(DEFAULT_PROFILE_IMAGE);
  const venueId = useVenueId();

  const { recentWorldUsers } = useRecentWorldUsers();

  const {
    userStatus,
    venueUserStatuses,
    isStatusEnabledForVenue,
  } = useVenueUserStatuses(venueId, user);

  const avatarSrc: string = user?.anonMode
    ? DEFAULT_PROFILE_IMAGE
    : user?.pictureUrl ?? DEFAULT_PROFILE_IMAGE;

  const { loadedImageUrl: pictureUrl } = useImage({
    src: avatarSrc,
    fallbackSrc: DEFAULT_PROFILE_IMAGE,
  });

  useEffect(() => {
    if (pictureUrl) {
      updateUserAvatar(pictureUrl);
    }
  }, [pictureUrl]);

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

  const status = user?.status;

  const nametagClasses = classNames("UserAvatar__nametag", {
    "UserAvatar__nametag--hover": showNametag === UsernameVisibility.hover,
  });

  const imageClasses = classNames("UserAvatar__image", imageClassName);

  const statusIndicatorClasses = classNames("UserAvatar__status-indicator", {
    "UserAvatar__status-indicator--online": isOnline,
    [`UserAvatar__status-indicator--${status}`]: isOnline && status,
    "UserAvatar__status-indicator--large": large,
  });

  const statusIndicatorStyles = useMemo(
    () => ({ backgroundColor: userStatus.color }),
    [userStatus.color]
  );

  //'isStatusEnabledForVenue' checks if the user status is enabled from the venue config.
  //'showStatus' is used to render this conditionally only in some of the screens.
  const hasUserStatus =
    isStatusEnabledForVenue &&
    showStatus &&
    isOnline &&
    !!venueUserStatuses.length;

  return (
    <div className={containerClasses}>
      {showNametag && <div className={nametagClasses}>{user?.partyName}</div>}
      <img
        className={imageClasses}
        src={userAvatar}
        alt={`${userDisplayName}'s avatar`}
        onClick={onClick}
      />

      {hasUserStatus && (
        <span
          className={statusIndicatorClasses}
          style={statusIndicatorStyles}
        />
      )}
    </div>
  );
};

export const UserAvatar = React.memo(_UserAvatar, isEqual);
