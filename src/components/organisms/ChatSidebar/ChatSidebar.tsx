import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

import {
  useChatSidebarControls,
  useChatSidebarInfo,
  useChatSidebarPinned,
} from "hooks/chatSidebar";

import { AnyVenue } from "types/venues";
import { ChatTypes } from "types/chat";

import { WithId } from "utils/id";

import { VenueChat, PrivateChats } from "./components";

import "./ChatSidebar.scss";

export interface ChatSidebarProps {
  venue: WithId<AnyVenue>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ venue }) => {
  const { isPinned } = useChatSidebarPinned(venue);
  const {
    isExpanded,
    toggleSidebar,
    chatSettings,
    selectVenueChat,
    selectPrivateChat,
  } = useChatSidebarControls();

  const { privateChatTabTitle, venueChatTabTitle } = useChatSidebarInfo(venue);

  const containerStyles = classNames("chat-sidebar", {
    "chat-sidebar--expanded": isExpanded || isPinned,
    "chat-sidebar--pinned": isPinned,
  });

  const venueChatTabStyles = classNames("chat-sidebar__tab", {
    "chat-sidebar__tab--selected":
      chatSettings.openedChatType === ChatTypes.VENUE_CHAT,
  });

  const privateChatTabStyles = classNames("chat-sidebar__tab", {
    "chat-sidebar__tab--selected":
      chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT,
  });

  return (
    <div className={containerStyles}>
      <div className="chat-sidebar__header">
        {!isPinned && (
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
        )}

        <div className="chat-sidebar__tabs">
          <div className={venueChatTabStyles} onClick={selectVenueChat}>
            {venueChatTabTitle}
          </div>
          <div className={privateChatTabStyles} onClick={selectPrivateChat}>
            {privateChatTabTitle}
          </div>
        </div>
      </div>
      <div className="chat-sidebar__tab-content">
        {chatSettings.openedChatType === ChatTypes.VENUE_CHAT && (
          <VenueChat venue={venue} />
        )}
        {chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT && (
          <PrivateChats recipientId={chatSettings.recipientId} venue={venue} />
        )}
      </div>
    </div>
  );
};
