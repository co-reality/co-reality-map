import React, { useCallback, useMemo, useState } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPoll,
  faQuestion,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { MessageToDisplay } from "types/chat";

import { WithId } from "utils/id";

import { ChatMessageBox } from "components/molecules/ChatMessageBox";
// import { ChatPoll } from "components/molecules/ChatPoll";
import { PollBox } from "components/molecules/PollBox";

import { ChatMessage } from "components/atoms/ChatMessage";

import "./Chatbox.scss";

export type Option = {
  icon: IconDefinition;
  name: string;
};

export const ChatMessageOption: Option[] = [
  {
    icon: faPoll,
    name: "Create Poll",
  },
  {
    icon: faQuestion,
    name: "Ask Question",
  },
];

export interface ChatboxProps {
  messages: WithId<MessageToDisplay>[];
  sendMessage: (text: string) => void;
  deleteMessage: (messageId: string) => void;
}

export const Chatbox: React.FC<ChatboxProps> = ({
  messages,
  sendMessage,
  deleteMessage,
}) => {
  const [activeOption, setActiveOption] = useState<Option>();

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => (
        <ChatMessage
          key={`${message.ts_utc}-${message.from}`}
          message={message}
          deleteMessage={() => deleteMessage(message.id)}
        />
      )),
    [messages, deleteMessage]
  );

  const dropdownOptions = useMemo(
    () =>
      ChatMessageOption.map((option) => (
        <Dropdown.Item
          key={option.name}
          onClick={() => setActiveOption(option)}
        >
          {option.name}
          <FontAwesomeIcon icon={option.icon} />
        </Dropdown.Item>
      )),
    []
  );

  const showPoll = activeOption?.name !== ChatMessageOption[0].name;

  const handleSubmit = useCallback((data) => console.log(data), []);

  const renderForms = useMemo(() => {
    switch (activeOption?.name) {
      case ChatMessageOption[0].name:
        return <PollBox onSubmit={handleSubmit} />;

      default:
        return <ChatMessageBox sendMessage={sendMessage} />;
    }
  }, [activeOption, sendMessage, handleSubmit]);

  return (
    <div className="chatbox">
      <div className="chatbox__messages">
        {
          renderedMessages
          // <ChatPoll
          //   pollData={pollData}
          //   deletePoll={console.log}
          // />
        }
      </div>
      <div className="chatbox__container">
        {showPoll ? (
          <DropdownButton
            id="options-dropdown"
            title="Options"
            className="chatbox__dropdown"
            variant="link"
            drop="up"
          >
            {dropdownOptions}
          </DropdownButton>
        ) : (
          <div
            className="chatbox__cancel-poll"
            onClick={() => setActiveOption(undefined)}
          >
            Cancel Poll
          </div>
        )}
        {renderForms}
      </div>
    </div>
  );
};
