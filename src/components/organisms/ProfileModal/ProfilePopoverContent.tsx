import React, { useState } from "react";

import { ProfileLink } from "types/User";
import { isDefined } from "utils/types";

import { useUser } from "hooks/useUser";

import { ContactsList } from "./ContactsList";
import { EditPasswordForm } from "./EditPasswordForm";
import { EditProfileForm } from "./EditProfileForm";
import { EditProfileLinkForm } from "./EditProfileLinkForm";
import { UserInformationContent } from "./UserInformationContent";

import "./ProfilePopoverContent.scss";

export enum UserProfileMode {
  DEFAULT,
  EDIT_PROFILE,
  EDIT_PASSWORD,
  EDIT_PROFILE_LINK,
  CONTACTS_LIST,
}

export const ProfilePopoverContent: React.FC = () => {
  const [mode, setMode] = useState<UserProfileMode>(UserProfileMode.DEFAULT);
  const [profileLink, setProfileLink] = useState<ProfileLink | undefined>(
    undefined
  );

  const { userWithId, user } = useUser();

  return (
    <div className="ProfilePopoverContent">
      {mode === UserProfileMode.DEFAULT && (
        <UserInformationContent
          setUserProfileMode={setMode}
          setProfileLinkToEdit={setProfileLink}
          user={userWithId}
          email={user?.email}
        />
      )}
      {mode === UserProfileMode.EDIT_PROFILE && (
        <EditProfileForm setUserProfileMode={setMode} />
      )}
      {mode === UserProfileMode.EDIT_PASSWORD && (
        <EditPasswordForm setUserProfileMode={setMode} />
      )}
      {mode === UserProfileMode.CONTACTS_LIST && (
        <ContactsList setUserProfileMode={setMode} />
      )}
      {mode === UserProfileMode.EDIT_PROFILE_LINK && (
        <EditProfileLinkForm
          user={userWithId}
          edit={isDefined(profileLink)}
          profileLink={profileLink}
          setUserProfileMode={setMode}
        />
      )}
    </div>
  );
};
