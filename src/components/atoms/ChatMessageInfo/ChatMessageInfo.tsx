import React, { useCallback } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { BaseMessageToDisplay } from "types/chat";

import { formatTimeLocalised } from "utils/time";

import { useProfileModalControls } from "hooks/useProfileModalControls";

import { UserAvatar } from "components/atoms/UserAvatar";

import "./ChatMessageInfo.scss";

export interface ChatMessageInfoProps {
  message: BaseMessageToDisplay;
  deleteMessage: () => void;
  reversed?: boolean;
}

export const ChatMessageInfo: React.FC<ChatMessageInfoProps> = ({
  message,
  deleteMessage,
  reversed: isReversed = false,
}) => {
  const { ts_utc, author, canBeDeleted } = message;
  const { openUserProfileModal } = useProfileModalControls();

  const timestamp = ts_utc.toMillis();

  const openAuthorProfile = useCallback(() => {
    openUserProfileModal(author);
  }, [openUserProfileModal, author]);

  const containerClasses = classNames("ChatMessageInfo", {
    "ChatMessageInfo--reverse": isReversed,
  });

  return (
    <div className={containerClasses}>
      <div className={containerClasses} onClick={openAuthorProfile}>
        <UserAvatar user={author} showStatus />
        <span className="ChatMessageInfo__author">{author.partyName}</span>
      </div>
      <span className="ChatMessageInfo__time">
        {formatTimeLocalised(timestamp)}
      </span>
      {canBeDeleted && (
        <FontAwesomeIcon
          onClick={deleteMessage}
          icon={faTrash}
          className="ChatMessageInfo__delete-icon"
          size="sm"
        />
      )}
    </div>
  );
};
