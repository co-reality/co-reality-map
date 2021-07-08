import React, { FC, useCallback, useMemo } from "react";
import classNames from "classnames";

import { updateTalkShowStudioExperience } from "api/profile";

import { currentVenueSelectorData } from "utils/selectors";

import { useShowHide } from "hooks/useShowHide";
import { useStage } from "hooks/useStage";
import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { useVenueId } from "hooks/useVenueId";

import { Button } from "components/atoms/Button";

import { ButtonWithLabel } from "components/templates/TalkShowStudio/components/Button/Button";
import { LeaveStageModal } from "components/templates/TalkShowStudio/components/LeaveStageModal";

import "./ControlBar.scss";

export interface ControlBarProps {
  isSharing: boolean;
  stopShare: () => void;
  shareScreen: () => void;
  onStageLeaving: () => void;
  onStageJoin: () => void;
  loading?: boolean;
  isRequestToJoinStageEnabled?: boolean;
}

export const ControlBar: FC<ControlBarProps> = ({
  isSharing,
  stopShare,
  shareScreen,
  onStageLeaving,
  onStageJoin,
  loading = false,
  isRequestToJoinStageEnabled = false,
}) => {
  const currentVenue = useSelector(currentVenueSelectorData);
  const venueId = useVenueId();
  const { userId } = useUser();
  const stage = useStage();

  const {
    isShown: isLeaveStageModalVisible,
    show: showLeaveStageModal,
    hide: hideLeaveStageModal,
  } = useShowHide();

  const isUserOwner = useMemo(
    () => !!userId && currentVenue?.owners.includes(userId),
    [currentVenue?.owners, userId]
  );

  const showSharingControl = useMemo(
    () => stage.isUserOnStage && (stage.canShareScreen || isSharing),
    [stage, isSharing]
  );

  const onClickShare = useCallback(() => {
    if (venueId && userId) {
      updateTalkShowStudioExperience({
        venueId,
        userId,
        experience: {
          isSharingScreen: !isSharing,
        },
      });
    }
    isSharing ? stopShare() : shareScreen();
  }, [venueId, userId, isSharing, stopShare, shareScreen]);

  const isJoinStageButtonDisplayed =
    isRequestToJoinStageEnabled &&
    stage.canJoinStage &&
    !isUserOwner &&
    !stage.isUserOnStage &&
    !stage.isUserRequesting;

  const controlBarClasses = classNames("ControlBar", {
    "ControlBar__sharing-off": !showSharingControl,
  });

  if (!stage.isUserOnStage) {
    if (stage.canJoinStage && isUserOwner) {
      return (
        <div className="JoinStage">
          <Button customClass={"JoinStage__button"} onClick={onStageJoin}>
            Join Stage
          </Button>
        </div>
      );
    }
  }

  return (
    <div className={controlBarClasses}>
      {showSharingControl && (
        <ButtonWithLabel
          onClick={onClickShare}
          rightLabel={isSharing ? "You are screensharing" : undefined}
          variant="secondary"
          small
          disabled={loading}
        >
          {isSharing ? "Stop Sharing" : "Share Screen"}
        </ButtonWithLabel>
      )}

      {(stage.isUserOnStage || stage.isUserRequesting) && (
        <>
          <ButtonWithLabel
            onClick={
              stage.isUserRequesting ? stage.leaveStage : showLeaveStageModal
            }
            leftLabel={
              stage.isUserRequesting
                ? "You requested to join"
                : "You are on stage"
            }
            variant="secondary"
            small
          >
            {stage.isUserRequesting ? "Cancel Request" : "Leave Stage"}
          </ButtonWithLabel>

          <LeaveStageModal
            show={isLeaveStageModalVisible}
            onHide={hideLeaveStageModal}
            onSubmit={onStageLeaving}
          />
        </>
      )}
      {isJoinStageButtonDisplayed && (
        <Button
          customClass="ControlBar__requestButton"
          onClick={stage.requestJoinStage}
        >
          <span>✋</span> Request to join
        </Button>
      )}
    </div>
  );
};
