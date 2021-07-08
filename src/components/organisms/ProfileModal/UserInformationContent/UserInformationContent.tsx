import React, { useCallback, useMemo } from "react";
import { useFirebase } from "react-redux-firebase";
import { useHistory } from "react-router-dom";

import { IS_BURN } from "secrets";
import { DEFAULT_PARTY_NAME } from "settings";

import { QuestionType } from "types/Question";
import { ProfileLink, User } from "types/User";

import { WithId } from "utils/id";
import {
  currentVenueSelector,
  currentVenueSelectorData,
} from "utils/selectors";
import { venueLandingUrl } from "utils/url";

import { useContactsListToDisplay } from "hooks/users";
import { useVenueId } from "hooks/useVenueId";
import { useSelector } from "hooks/useSelector";

import { updateUserProfile } from "pages/Account/helpers";

import { Badges } from "components/organisms/Badges";
import { UserStatusDropdown } from "components/atoms/UserStatusDropdown";
import { Button } from "components/atoms/Button";
import { UserAvatar } from "components/atoms/UserAvatar";

import editIcon from "assets/icons/profile-edit-icon.svg";

import { UserProfileMode } from "../ProfilePopoverContent";

import "./UserInformationContent.scss";

export interface UserInformationContentProps {
  setUserProfileMode: (value: UserProfileMode) => void;
  setProfileLinkToEdit: (profileLink?: ProfileLink) => void;
  user?: WithId<User>;
  email?: string | null;
}

export const UserInformationContent: React.FunctionComponent<UserInformationContentProps> = ({
  setUserProfileMode,
  setProfileLinkToEdit,
  user,
  email,
}) => {
  const contactsList = useContactsListToDisplay();
  const profileQuestions = useSelector(
    (state) => currentVenueSelectorData(state)?.profile_questions
  );
  const venueId = useVenueId();
  const venue = useSelector(currentVenueSelector);

  const history = useHistory();
  const firebase = useFirebase();

  const logout = useCallback(async () => {
    await firebase.auth().signOut();

    history.push(IS_BURN ? "/enter" : venueId ? venueLandingUrl(venueId) : "/");
  }, [firebase, history, venueId]);

  const toggleKidsMode = useCallback(async () => {
    if (user) {
      user.kidsMode = !user?.kidsMode;
      await updateUserProfile(user.id, { kidsMode: user.kidsMode });
    }
  }, [user]);

  const toggleAnonMode = useCallback(async () => {
    if (user) {
      user.anonMode = !user?.anonMode;
      await updateUserProfile(user.id, { anonMode: user.anonMode });
    }
  }, [user]);

  const toggleMirrorVideo = useCallback(async () => {
    if (user) {
      user.mirrorVideo = !user?.mirrorVideo;
      await updateUserProfile(user.id, { mirrorVideo: user.mirrorVideo });
    }
  }, [user]);

  const profileLinks = useMemo(() => {
    const makeEditProfileLink = (profileLink?: ProfileLink) => () => {
      setProfileLinkToEdit(profileLink);
      setUserProfileMode(UserProfileMode.EDIT_PROFILE_LINK);
    };

    return (
      <>
        <ul className="UserInformationContent__profile-links">
          {user?.profileLinks?.map((profileLink) => (
            <li key={profileLink.title}>
              {profileLink.title}{" "}
              <button
                className="button--a"
                onClick={makeEditProfileLink(profileLink)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        <button
          className="UserInformationContent__add-profile-link button--a"
          onClick={makeEditProfileLink(undefined)}
        >
          Add a profile link
        </button>
      </>
    );
  }, [setProfileLinkToEdit, setUserProfileMode, user?.profileLinks]);

  // @debt We need to rework the way we store answers to profile questions
  const questions = useMemo(
    () =>
      profileQuestions
        // @ts-ignore question.name is a correct index for type User
        ?.filter((question: QuestionType) => user?.[question.name])
        .map((question) => (
          <div key={question.name} className="question-section">
            <div className="question">{question.text}</div>
            {/* @ts-ignore question.name is a correct index for type User */}
            <div>{user?.[question.name]}</div>
          </div>
        )),
    [profileQuestions, user]
  );

  if (!user) return null;

  return (
    <div className="UserInformationContent">
      <h1 className="UserInformationContent__title">My Profile</h1>
      <div className="UserInformationContent__information">
        <div>
          <UserAvatar user={user} showStatus large />
        </div>
        <div className="UserInformationContent__text-container">
          <h3 className="UserInformationContent__user-name">
            {user?.partyName ?? DEFAULT_PARTY_NAME}
          </h3>
          <div
            // @debt the reason of the nullish coalescing here is that email property of AuthTypes.UserInfo interface accepts null
            title={email ?? ""}
            className="UserInformationContent__ellipsis-text"
          >
            {email}
          </div>
          <div className="UserInformationContent__status-container">
            <span className="UserInformationContent__status-prefix">
              Available
            </span>
            <UserStatusDropdown />
          </div>
        </div>
        <Button
          customClass="UserInformationContent__edit"
          onClick={() => setUserProfileMode(UserProfileMode.EDIT_PROFILE)}
        >
          <img src={editIcon} alt="edit" />
        </Button>
      </div>
      <Button
        customClass="UserInformationContent__contacts"
        onClick={() => setUserProfileMode(UserProfileMode.CONTACTS_LIST)}
      >
        {`${contactsList.length} Contacts`}
      </Button>
      {questions}

      {profileLinks}

      {IS_BURN && (
        <>
          <label
            htmlFor="chk-kidsMode"
            className={`checkbox ${user?.kidsMode && "checkbox-checked"}`}
          >
            Kids Mode
          </label>
          <input
            type="checkbox"
            name="kidsMode"
            id="chk-kidsMode"
            defaultChecked={user?.kidsMode || false}
            onClick={() => toggleKidsMode()}
          />
          <label
            htmlFor={"chk-anonMode"}
            className={`checkbox ${user?.anonMode && "checkbox-checked"}`}
          >
            Anonymous Mode
          </label>
          <input
            type="checkbox"
            name={"anonMode"}
            id={"chk-anonMode"}
            defaultChecked={user?.anonMode || false}
            onClick={() => toggleAnonMode()}
          />
        </>
      )}
      {venue?.showBadges && <Badges user={user} currentVenue={venue} />}
      <label
        htmlFor="chk-mirrorVideo"
        className={`checkbox ${user?.mirrorVideo && "checkbox-checked"}`}
      >
        Mirror my video
      </label>
      <input
        type="checkbox"
        name="mirrorVideo"
        id="chk-mirrorVideo"
        defaultChecked={user?.mirrorVideo || false}
        onClick={() => toggleMirrorVideo()}
      />
      <Button
        customClass="UserInformationContent__button"
        onClick={() => setUserProfileMode(UserProfileMode.EDIT_PASSWORD)}
      >
        Change password
      </Button>
      <Button customClass="UserInformationContent__button" onClick={logout}>
        Log out
      </Button>
    </div>
  );
};
