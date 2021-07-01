import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReply, faVideo } from "@fortawesome/free-solid-svg-icons";

import { MessageToDisplay } from "types/chat";

import { WithId } from "utils/id";
import { formatTimestampToDisplayHoursMinutes } from "utils/time";

import { useShowHide } from "hooks/useShowHide";

import { ChatMessageInfo } from "components/atoms/ChatMessageInfo";
import { TextButton } from "components/atoms/TextButton";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import "./ChatMessage.scss";

export interface ChatProps {
  message: WithId<MessageToDisplay>;
  deleteMessage: (messageId: string) => void;
  selectThisThread: () => void;
}

export const ChatMessage: React.FC<ChatProps> = ({
  message,
  deleteMessage,
  selectThisThread,
}) => {
  const { text, replies, id, isMine, isQuestion } = message;

  const deleteThisMessage = useCallback(() => deleteMessage(id), [
    deleteMessage,
    id,
  ]);

  const { isShown: isRepliesShown, toggle: toggleReplies } = useShowHide();

  const containerStyles = classNames("ChatMessage", {
    "ChatMessage--me": isMine,
    "ChatMessage--question": isQuestion,
  });

  const renderedReplies = useMemo(
    () =>
      replies?.map((reply) => (
        <div key={reply.id} className="ChatMessage__reply">
          <RenderMarkdown text={reply.text} allowHeadings={false} />
          <ChatMessageInfo
            message={reply}
            deleteMessage={() => deleteMessage(reply.id)}
          />
        </div>
      )),
    [replies, deleteMessage]
  );

  const repliesCount = renderedReplies.length;

  const hasReplies = repliesCount !== 0;

  const hasMultipleReplies = repliesCount > 1;

  const replyText = hasMultipleReplies ? "replies" : "reply";

  const replyButtonText = !isRepliesShown
    ? `${repliesCount} ${replyText}`
    : `hide ${replyText}`;

  if (message.isVideo) {
    return (
      <div className="ChatMessage__video-chat">
        <div className="ChatMessage__video-info">
          <FontAwesomeIcon
            icon={faVideo}
            className="ChatMessage__video-icon"
            size="sm"
          />
          <div>Video call has ended.</div>
        </div>
        <div className="ChatMessage__video-timestamp">
          {formatTimestampToDisplayHoursMinutes(message.ts_utc.toMillis())}
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <div className="ChatMessage__bulb">
        <div className="ChatMessage__text-content">
          <div className="ChatMessage__text">
            <RenderMarkdown text={text} allowHeadings={false} />
          </div>

          <div className="ChatMessage__reply-icon">
            <FontAwesomeIcon
              icon={faReply}
              size="sm"
              onClick={selectThisThread}
            />
          </div>
          {hasReplies && (
            <TextButton
              containerClassName="ChatMessage__show-replies-button"
              onClick={toggleReplies}
              label={replyButtonText}
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
        reversed={isMine}
        deleteMessage={deleteThisMessage}
      />
    </div>
  );
};
