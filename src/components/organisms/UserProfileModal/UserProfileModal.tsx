import React, { useCallback, useMemo } from "react";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";

import {
  ENABLE_SUSPECTED_LOCATION,
  RANDOM_AVATARS,
  DEFAULT_PROFILE_PIC,
  DEFAULT_PARTY_NAME,
} from "settings";

import { orderedVenuesSelector } from "utils/selectors";
import { WithId } from "utils/id";
import { venueInsideUrl, venuePreviewUrl } from "utils/url";

import { User } from "types/User";
import { AnyVenue, isVenueWithRooms } from "types/venues";

import { useUser } from "hooks/useUser";
import { useProfileModalControls } from "hooks/useProfileModalControls";
import { useSelector } from "hooks/useSelector";
import { useFirestoreConnect } from "hooks/useFirestoreConnect";
import { useChatSidebarControls } from "hooks/chatSidebar";

import { Badges } from "components/organisms/Badges";
import { Button } from "components/atoms/Button";

import "./UserProfileModal.scss";

export interface UserProfileModalProps {
  venue: WithId<AnyVenue>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  venue,
}) => {
  const { user } = useUser();

  const { selectRecipientChat } = useChatSidebarControls();

  const {
    selectedUserProfile,
    hasSelectedProfile,
    closeUserProfileModal,
  } = useProfileModalControls();

  const {
    id: chosenUserId,
    profileLinks,
    pictureUrl,
    partyName,
    realName,
    companyDepartment,
    companyTitle,
  } = selectedUserProfile ?? {};

  const profileQuestions = venue?.profile_questions;

  const openChosenUserChat = useCallback(() => {
    if (!chosenUserId) return;

    selectRecipientChat(chosenUserId);
    // NOTE: Hide the modal, after the chat is opened;
    closeUserProfileModal();
  }, [selectRecipientChat, closeUserProfileModal, chosenUserId]);

  const renderedProfileQuestionAnswers = useMemo(
    () =>
      selectedUserProfile
        ? profileQuestions?.map((question) => {
            // @ts-ignore User type doesn't accept string indexing. We need to rework the way we store answers to profile questions
            const questionAnswer = selectedUserProfile[question.name];

            if (!questionAnswer) return undefined;

            return (
              <React.Fragment key={question.text}>
                <p className="light no-margin">{question.text}</p>
                <p className="h6">{questionAnswer}</p>
              </React.Fragment>
            );
          })
        : undefined,
    [selectedUserProfile, profileQuestions]
  );

  const renderedProfileLinks = useMemo(
    () =>
      profileLinks?.map((link) => (
        <a
          key={link.title}
          className="UserProfileModal__profile-link"
          href={link.url}
          target="_blank"
          rel="noreferrer"
        >
          {link.title}
        </a>
      )),
    [profileLinks]
  );

  if (!selectedUserProfile || !chosenUserId || !user) {
    return null;
  }

  return (
    <Modal
      className="UserProfileModal"
      show={hasSelectedProfile}
      onHide={closeUserProfileModal}
    >
      <Modal.Body>
        <div className="modal-container modal-container_profile">
          <div className="profile-information-container">
            <div className="profile-basics">
              <div className="profile-pic">
                {/* @debt Refactor this to use our useImage hook? Or just UserAvatar / UserProfilePicture directly? */}
                <img
                  src={pictureUrl ?? DEFAULT_PROFILE_PIC}
                  alt="profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src =
                      "/avatars/" +
                      RANDOM_AVATARS[
                        Math.floor(
                          chosenUserId.charCodeAt(0) % RANDOM_AVATARS.length
                        )
                      ];
                  }}
                />
              </div>
              <div className="profile-text">
                <h2 className="italic">{partyName ?? DEFAULT_PARTY_NAME}</h2>
              </div>
            </div>
            {realName && (
              <>
                <p className="light no-margin">Full Name</p>
                <p className="h6">{realName}</p>
              </>
            )}
            {companyDepartment && (
              <>
                <p className="light no-margin">Department</p>
                <p className="h6">{companyDepartment}</p>
              </>
            )}
            {companyTitle && (
              <>
                <p className="light no-margin">Title</p>
                <p className="h6">{companyTitle}</p>
              </>
            )}
            <div className="profile-extras">
              {renderedProfileQuestionAnswers}
            </div>
            <div>{renderedProfileLinks}</div>
            {ENABLE_SUSPECTED_LOCATION && (
              <div className="profile-location">
                <p className="question">Suspected Location:</p>
                <p className="h6 location">
                  <SuspectedLocation
                    user={selectedUserProfile}
                    currentVenue={venue}
                  />
                </p>
              </div>
            )}
          </div>
          {venue?.showBadges && (
            <Badges user={selectedUserProfile} currentVenue={venue} />
          )}
          {chosenUserId !== user.uid && (
            <Button onClick={openChosenUserChat}>Send message</Button>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

const SuspectedLocation: React.FC<{
  user: WithId<User>;
  currentVenue: WithId<AnyVenue>;
}> = ({ user, currentVenue }) => {
  // @debt This will currently load all venues in firebase into memory.. not very efficient
  useFirestoreConnect("venues");
  const allVenues = useSelector(orderedVenuesSelector);

  const suspectedLocation = useMemo(
    () => ({
      venue: allVenues?.find(
        (v) =>
          (user.lastSeenIn && user.lastSeenIn[currentVenue?.name ?? ""]) ||
          v.name === user.room
      ),
      room: allVenues?.find(
        (v) =>
          isVenueWithRooms(v) && v.rooms?.find((r) => r.title === user.room)
      ),
    }),
    [user, allVenues, currentVenue]
  );

  if (!user.room || !allVenues) {
    return null;
  }

  if (suspectedLocation.venue) {
    return (
      <Link to={venueInsideUrl(suspectedLocation.venue.id)}>
        {suspectedLocation.venue.name}
      </Link>
    );
  }

  if (suspectedLocation.room) {
    return (
      <Link to={venuePreviewUrl(suspectedLocation.room.id, user.room)}>
        Room {user.room}, in camp {suspectedLocation.room.name}
      </Link>
    );
  }

  return <>This user has gone walkabout. Location unguessable</>;
};
