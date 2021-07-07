import React, { FC, useCallback, useMemo } from "react";
import classNames from "classnames";

import { updateTalkShowStudioExperience } from "api/profile";

import { useShowHide } from "hooks/useShowHide";
import { useStage } from "hooks/useStage";
import { useUser } from "hooks/useUser";
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
  showJoinStageButton?: boolean;
}

export const ControlBar: FC<ControlBarProps> = ({
  isSharing,
  stopShare,
  shareScreen,
  onStageLeaving,
  onStageJoin,
  loading = false,
  showJoinStageButton = false,
}) => {
  const venueId = useVenueId();
  const { userId } = useUser();
  const stage = useStage({ venueId });

  const {
    isShown: isLeaveStageModalVisible,
    show: showLeaveStageModal,
    hide: hideLeaveStageModal,
  } = useShowHide();

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

  const controlBarClasses = classNames("ControlBar", {
    "ControlBar--one-item": !showSharingControl,
  });

  if (!stage.isUserOnStage) {
    if (stage.canJoinStage && showJoinStageButton) {
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
    </div>
  );
};
