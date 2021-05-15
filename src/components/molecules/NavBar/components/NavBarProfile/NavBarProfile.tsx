import React from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";

import { useUser } from "hooks/useUser";

import { WithId } from "utils/id";

import { User } from "types/User";

import { ProfilePopoverContent } from "components/organisms/ProfileModal";
import { UserAvatar } from "components/atoms/UserAvatar";

export const NavBarProfile: React.FC = () => {
  const { profile, user } = useUser();

  if (!profile || !user) return;

  const userWithId = { ...profile, id: user.uid } as WithId<User>;

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose={true}
      overlay={
        <Popover id="profile-popover">
          <Popover.Content>
            <ProfilePopoverContent />
          </Popover.Content>
        </Popover>
      }
    >
      <UserAvatar user={userWithId} containerClassName="navbar-link-profile" />
    </OverlayTrigger>
  );
};
