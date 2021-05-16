import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReply } from "@fortawesome/free-solid-svg-icons";

import { MessageToDisplay } from "types/chat";

import { WithId } from "utils/id";

import { useShowHide } from "hooks/useShowHide";

import { ChatMessageInfo } from "components/atoms/ChatMessageInfo";
import { TextButton } from "components/atoms/TextButton";

import "./ChatMessage.scss";

export interface ChatProps {
  message: WithId<MessageToDisplay>;
  deleteMessage: (messageId: string) => void;
  setChosenThread: (message: WithId<MessageToDisplay>) => void;
}

export const ChatMessage: React.FC<ChatProps> = ({
  message,
  deleteMessage,
  setChosenThread,
}) => {
  const { text, isMine, replies, id } = message;

  const deleteThisMessage = useCallback(() => deleteMessage(id), [
    deleteMessage,
    id,
  ]);

  const selectThisThread = useCallback(() => setChosenThread(message), [
    setChosenThread,
    message,
  ]);

  const { isShown: isRepliesShown, toggle: toggleReplies } = useShowHide();

  const containerStyles = classNames("ChatMessage", {
    "ChatMessage--me": isMine,
  });

  const renderedReplies = useMemo(
    () =>
      replies?.map((reply) => (
        <div key={reply.id} className="ChatMessage__reply">
          {reply.text}
          <ChatMessageInfo
            message={reply}
            deleteMessage={() => deleteMessage(reply.id)}
          />
        </div>
      )),
    [replies, deleteMessage]
  );

  const repliesCount = renderedReplies.length;

  const hasMultipleReplies = repliesCount > 1;

  const replyText = hasMultipleReplies ? "replies" : "reply";

  const replyButtonText = !isRepliesShown
    ? `${repliesCount} ${replyText}`
    : `hide ${replyText}`;

  return (
    <div className={containerStyles}>
      <div className="ChatMessage__bulb">
        <div className="ChatMessage__text-content">
          <div className="ChatMessage__text">{text}</div>

          <div className="ChatMessage__reply-icon">
            <FontAwesomeIcon icon={faReply} size="sm" onClick={onReplyClick} />
          </div>
          {repliesCount && (
            <TextButton
              containerClassName="ChatMessage__show-replies-button"
              onClick={toggleReplies}
              text={replyButtonText}
            />
          )}
        </div>

        <div className="ChatMessage__replies-content">
          {isRepliesShown && (
            <div className="ChatMessage__replies">{renderedReplies}</div>
          )}
        </div>
      </div>
      <ChatMessageInfo
        message={message}
        isReversed={isMine}
        deleteMessage={onMessageDelete}
      />
    </div>
  );
};
