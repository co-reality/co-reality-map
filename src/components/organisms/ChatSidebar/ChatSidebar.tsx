import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

import { VenueChat, PrivateChats, Twitter } from "./components";

import { useChatSidebarControls, useChatSidebarInfo } from "hooks/chatSidebar";

import { ChatTypes } from "types/chat";

import "./ChatSidebar.scss";

export const ChatSidebar: React.FC = () => {
  const {
    isExpanded,
    toggleSidebar,
    chatSettings,
    selectVenueChat,
    selectPrivateChat,
    selectTwitterChat,
  } = useChatSidebarControls();

  const {
    privateChatTabTitle,
    venueChatTabTitle,
    twitterTabTitle,
  } = useChatSidebarInfo();

  const containerStyles = classNames("chat-sidebar", {
    "chat-sidebar--expanded": isExpanded,
  });

  const venueChatTabStyles = classNames("chat-sidebar__tab", {
    "chat-sidebar__tab--selected":
      chatSettings.openedChatType === ChatTypes.VENUE_CHAT,
  });

  const privateChatTabStyles = classNames("chat-sidebar__tab", {
    "chat-sidebar__tab--selected":
      chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT,
  });

  const twitterTabStyles = classNames("chat-sidebar__tab", {
    "chat-sidebar__tab--selected":
      chatSettings.openedChatType === ChatTypes.TWITTER,
  });

  return (
    <div className={containerStyles}>
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__controller" onClick={toggleSidebar}>
          {isExpanded ? (
            <FontAwesomeIcon icon={faChevronRight} size="sm" />
          ) : (
            <>
              <FontAwesomeIcon icon={faChevronLeft} size="sm" />
              <FontAwesomeIcon
                className="chat-sidebar__controller__second-icon"
                icon={faCommentDots}
                size="lg"
              />
            </>
          )}
        </div>
        <div className="chat-sidebar__tabs">
          <div className={venueChatTabStyles} onClick={selectVenueChat}>
            {venueChatTabTitle}
          </div>
          <div className={privateChatTabStyles} onClick={selectPrivateChat}>
            {privateChatTabTitle}
          </div>
          <div className={twitterTabStyles} onClick={selectTwitterChat}>
            {twitterTabTitle}
          </div>
        </div>
      </div>
      <div className="chat-sidebar__tab-content">
        {chatSettings.openedChatType === ChatTypes.VENUE_CHAT && <VenueChat />}
        {chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT && (
          <PrivateChats recipientId={chatSettings.recipientId} />
        )}
        {chatSettings.openedChatType === ChatTypes.TWITTER && <Twitter />}
      </div>
    </div>
  );
};
