import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPoll } from "@fortawesome/free-solid-svg-icons";

import {
  PollMessage,
  BaseMessageToDisplay,
  PollVoteBase,
  PollQuestion,
  DeleteMessage,
} from "types/chat";
import { AnyVenue } from "types/venues";

import { WithId } from "utils/id";

import { useRoles } from "hooks/useRoles";
import { useUser } from "hooks/useUser";

import { ChatMessageInfo } from "components/atoms/ChatMessageInfo";
import { Button } from "components/atoms/Button";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import "./ChatPoll.scss";

export interface ChatPollProps {
  pollMessage: WithId<BaseMessageToDisplay<PollMessage>>;
  venue: WithId<AnyVenue>;
  deletePollMessage: DeleteMessage;
  voteInPoll: (pollVote: PollVoteBase) => void;
}

export const ChatPoll: React.FC<ChatPollProps> = ({
  pollMessage,
  venue,
  voteInPoll,
  deletePollMessage,
}) => {
  const { userId } = useUser();
  const { userRoles } = useRoles();

  const isAdmin = Boolean(userRoles?.includes("admin"));
  const owners = venue.owners;

  const { id, poll, votes, isMine } = pollMessage;
  const { questions, topic } = poll;

  const canBeDeleted: boolean = useMemo(() => {
    if (!userId || !owners.length) return false;

    return isAdmin && owners.includes(userId);
  }, [isAdmin, userId, owners]);

  const hasVoted = userId
    ? votes.some(({ userId: existingUserId }) => userId === existingUserId)
    : false;

  const message = useMemo(() => ({ ...pollMessage, canBeDeleted }), [
    pollMessage,
    canBeDeleted,
  ]);

  const containerStyles = classNames("ChatPoll", {
    "ChatPoll--me": isMine,
  });

  const handleVote = useCallback(
    (question) =>
      voteInPoll({
        questionId: question.id,
        pollId: id,
      }),
    [id, voteInPoll]
  );

  const renderQuestions = useMemo(
    () =>
      questions.map((question) => (
        <Button
          key={question.name}
          customClass="ChatPoll__question"
          onClick={() => handleVote(question)}
        >
          <RenderMarkdown text={question.name} />
        </Button>
      )),
    [questions, handleVote]
  );

  const calculateVotePercentage = useCallback(
    (item: PollQuestion) =>
      votes.length
        ? Math.floor(
            (votes.filter(({ questionId }) => questionId === item.id).length /
              votes.length) *
              100
          )
        : 0,
    [votes]
  );

  const renderResults = useMemo(() => {
    const sortedQuestions = questions
      .map((item) => ({
        ...item,
        share: calculateVotePercentage(item),
      }))
      .sort((a, b) => b.share - a.share);

    return sortedQuestions.map((question) => (
      <div key={question.name} className="ChatPoll__text">
        <div
          className="ChatPoll__text-background"
          style={{ width: `${question.share}%` }}
        />
        <span className="ChatPoll__text-count">{question.share}%</span>
        <RenderMarkdown text={question.name} />
      </div>
    ));
  }, [questions, calculateVotePercentage]);

  const deleteThisPollMessage = useCallback(() => deletePollMessage(id), [
    id,
    deletePollMessage,
  ]);

  return (
    <div className={containerStyles}>
      <div className="ChatPoll__bulb">
        <FontAwesomeIcon className="ChatPoll__icon" icon={faPoll} size="lg" />
        <div className="ChatPoll__topic">
          <RenderMarkdown text={topic} />
        </div>
        <div>{isMine || hasVoted ? renderResults : renderQuestions}</div>
        <div className="ChatPoll__details">
          <span>{`${votes.length} votes`}</span>
        </div>
      </div>

      <ChatMessageInfo
        message={message}
        reversed={isMine}
        deleteMessage={deleteThisPollMessage}
      />
    </div>
  );
};
