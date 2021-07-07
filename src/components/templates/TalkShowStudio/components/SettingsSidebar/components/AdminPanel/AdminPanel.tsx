import React, { FC, useMemo, useState } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faVideoSlash,
  faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";

import { MAX_TALK_SHOW_STUDIO_HOSTS } from "settings";

import { FullTalkShowVenue, VenueTemplate } from "types/venues";
import { PlaceInTalkShowStudioVenue, User } from "types/User";
import { AllEmojiReactions, EmojiReactionType } from "types/reactions";

import { updateUserTalkShowStudioExperience, updateVenue_v2 } from "api/admin";

import { WithId } from "utils/id";

import { useShowHide } from "hooks/useShowHide";
import { useStage } from "hooks/useStage";
import { useUser } from "hooks/useUser";

import { Button } from "components/atoms/Button";

import { LeaveStageModal } from "components/templates/TalkShowStudio/components/LeaveStageModal";

import "./AdminPanel.scss";

const requestEmoji = AllEmojiReactions.find(
  (emoji) => emoji.type === EmojiReactionType.request
)!;

export interface AdminPanelProps {
  venue: WithId<FullTalkShowVenue>;
}

export const AdminPanel: FC<AdminPanelProps> = ({ venue }) => {
  const venueId = venue.id;
  const { user: loggedUser, userId: loggedUserId } = useUser();
  const stage = useStage({ venueId });
  const [userToRemove, setUserToRemove] = useState<WithId<User>>();
  const {
    isShown: isLeaveStageModalVisible,
    show: showLeaveStageModal,
    hide: hideLeaveStageModal,
  } = useShowHide();

  const controlUserButtonClasses = (isOff: boolean) =>
    classNames("AdminPanelUser__controlUserButton", {
      "AdminPanelUser__controlUserButton-off": isOff,
    });

  const slots = useMemo(
    () =>
      Array.from(
        Array(MAX_TALK_SHOW_STUDIO_HOSTS - stage.peopleOnStage.length).keys()
      ),
    [stage.peopleOnStage]
  );

  return (
    <div className="AdminPanel">
      <div className="AdminPanel__peopleOnStage">
        <p className="AdminPanel__sectionLabel">
          {stage.peopleOnStage.length} people on stage
        </p>
        <div>
          {stage.peopleOnStage.map((user) => {
            const isMuted = !!(venueId && user.data?.[venueId].isMuted);
            const isUserCameraOff = !!(
              venueId && user.data?.[venueId].isUserCameraOff
            );

            return (
              <div key={user.id} className="AdminPanelUser">
                <div className="AdminPanelUser__info">
                  <div className="AdminPanelUser__picture">
                    {user.pictureUrl && (
                      <img src={user.pictureUrl} alt="profile" />
                    )}
                  </div>
                  {user.partyName || ""}
                  {isMuted && " (muted)"}
                </div>

                {user.id !== loggedUserId && (
                  <div className="AdminPanelUser__buttons">
                    <div
                      className="AdminPanelUser__controlUserButton"
                      onClick={() => {
                        setUserToRemove(user);
                        showLeaveStageModal();
                      }}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </div>
                    <div
                      className={controlUserButtonClasses(isMuted)}
                      onClick={() =>
                        !isMuted && stage.toggleUserMicrophone(user)
                      }
                    >
                      <FontAwesomeIcon icon={faVolumeMute} />
                    </div>
                    <div
                      className={controlUserButtonClasses(isUserCameraOff)}
                      onClick={() =>
                        !isUserCameraOff && stage.toggleUserCamera(user)
                      }
                    >
                      <FontAwesomeIcon icon={faVideoSlash} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {slots.map((slot) => (
            <div key={slot} className="AdminPanelSlot">
              <div className="AdminPanelSlot__info">
                <div className="AdminPanelSlot__picture" />
                Slot {slot + 1 + stage.peopleOnStage.length}
              </div>
            </div>
          ))}
        </div>
      </div>
      {stage.screenSharingUser && (
        <div className="AdminPanel__screenSharing">
          <p className="AdminPanel__sectionLabel">Screenshare</p>
          <div key={stage.screenSharingUser.id} className="AdminPanelUser">
            <div className="AdminPanelUser__info">
              <div className="AdminPanelUser__picture">
                {stage.screenSharingUser.pictureUrl && (
                  <img src={stage.screenSharingUser.pictureUrl} alt="profile" />
                )}
              </div>
              {stage.screenSharingUser.partyName || ""} is currently sharing
            </div>

            <Button
              customClass="AdminPanel__controlSceneButton"
              onClick={() => {
                venueId &&
                  updateUserTalkShowStudioExperience(
                    venueId,
                    stage.screenSharingUser!.id,
                    {
                      isSharingScreen: false,
                    }
                  );
              }}
            >
              Stop
            </Button>
          </div>
        </div>
      )}
      <div className="AdminPanel__requests">
        {venue.requestToJoinStage ? (
          <>
            <p className="AdminPanel__sectionLabel">
              {stage.peopleRequesting.length} Requests to join stage
            </p>
            <div>
              {stage.peopleRequesting.map((user) => (
                <div key={user.id} className="AdminPanelUser">
                  <div className="AdminPanelUser__info">
                    <div className="AdminPanelUser__picture">
                      {user.pictureUrl && (
                        <img src={user.pictureUrl} alt="profile" />
                      )}
                      <div
                        className="AdminPanelUser__picture-reaction"
                        role="img"
                        aria-label={requestEmoji.ariaLabel}
                      >
                        {requestEmoji.text}
                      </div>
                    </div>
                    {user.partyName || ""}
                  </div>
                  {stage.canJoinStage && (
                    <div
                      className="AdminPanelUser__controlUserButton"
                      onClick={() => {
                        venueId &&
                          updateUserTalkShowStudioExperience(venueId, user.id, {
                            place: PlaceInTalkShowStudioVenue.stage,
                          });
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </div>
                  )}
                </div>
              ))}
              <Button
                customClass="AdminPanel__controlSceneButton"
                onClick={() => {
                  venueId &&
                    loggedUser &&
                    updateVenue_v2(
                      {
                        name: venue.name,
                        requestToJoinStage: false,
                      },
                      loggedUser
                    );
                }}
              >
                Stop join requests
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="AdminPanel__sectionLabel">
              Joining stage option is disabled
            </p>
            <div>
              <Button
                customClass="AdminPanel__controlSceneButton"
                onClick={() => {
                  venueId &&
                    loggedUser &&
                    updateVenue_v2(
                      {
                        name: venue.name,
                        template: VenueTemplate.talkshowstudio,
                        requestToJoinStage: true,
                      },
                      loggedUser
                    );
                }}
              >
                <span>✋</span> Allow people to request to join
              </Button>
            </div>
          </>
        )}
      </div>
      <LeaveStageModal
        show={isLeaveStageModalVisible}
        onHide={hideLeaveStageModal}
        onSubmit={stage.removeUserFromStage}
        userToRemove={userToRemove}
      />
    </div>
  );
};
