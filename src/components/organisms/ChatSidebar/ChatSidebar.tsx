import React, { useState } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

import { Resizable } from "re-resizable";

import { useChatSidebarControls, useChatSidebarInfo } from "hooks/chatSidebar";

import { ChatTypes } from "types/chat";
import { AnyVenue } from "types/venues";

import { WithId } from "utils/id";

import { VenueChat, PrivateChats } from "./components";

import "./ChatSidebar.scss";

export interface ChatSidebarProps {
  venue: WithId<AnyVenue>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ venue }) => {
  const {
    isExpanded,
    toggleSidebar,
    chatSettings,
    selectVenueChat,
    selectPrivateChat,
  } = useChatSidebarControls();

  const { privateChatTabTitle, venueChatTabTitle } = useChatSidebarInfo();

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

  const widthStorageKey = "chatSideBarWidth";
  const initWidth = localStorage.getItem(widthStorageKey);
  let [width, setWidth] = useState<number>(initWidth ? +initWidth : 400);

  console.log("current width", width, initWidth);

  return (
    <div className={containerStyles}>
      <Resizable
        defaultSize={{
          width,
          height: "100%",
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          const newWidth = width + d.width;
          setWidth(newWidth);
          localStorage.setItem(widthStorageKey, newWidth.toString());
        }}
        enable={{ left: true }}
      >
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
          </div>
        </div>
        <div className="chat-sidebar__tab-content">
          {chatSettings.openedChatType === ChatTypes.VENUE_CHAT && (
            <VenueChat venue={venue} />
          )}
          {chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT && (
            <PrivateChats
              recipientId={chatSettings.recipientId}
              venue={venue}
            />
          )}
        </div>
      </Resizable>
    </div>
  );
};
