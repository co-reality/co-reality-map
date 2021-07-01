import React, { useCallback, useEffect } from "react";
import { useHistory } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faVideo } from "@fortawesome/free-solid-svg-icons";

import { inviteToVideoRoom } from "api/videoRoom";

import { AnyVenue } from "types/venues";

import { WithId } from "utils/id";

import { Chatbox } from "components/molecules/Chatbox";
import { UserAvatar } from "components/atoms/UserAvatar";

import { useRecipientChat } from "hooks/privateChats";
import { useChatSidebarControls } from "hooks/chatSidebar";
import { useUser } from "hooks/useUser";

import "./RecipientChat.scss";

export interface RecipientChatProps {
  recipientId: string;
  venue: WithId<AnyVenue>;
}

export const RecipientChat: React.FC<RecipientChatProps> = ({
  recipientId,
  venue,
}) => {
  const {
    messagesToDisplay,
    recipient,

    sendMessageToSelectedRecipient,
    deleteMessage,
    markMessageRead,
    sendThreadReply,
  } = useRecipientChat(recipientId);

  const { user } = useUser();
  const history = useHistory();

  useEffect(() => {
    const unreadCounterpartyMessages = messagesToDisplay.filter(
      (message) => !message.isRead && message.from === recipientId
    );

    if (unreadCounterpartyMessages.length > 0) {
      unreadCounterpartyMessages.forEach((message) =>
        markMessageRead(message.id)
      );
    }
  }, [messagesToDisplay, recipientId, markMessageRead]);

  const startVideoRoom = useCallback(async () => {
    if (!user?.uid || !recipientId || !venue.id) return;

    const response = await inviteToVideoRoom(user.uid, venue.id, recipientId);

    const videoRoomId = response.data;

    if (videoRoomId) {
      history.push(`/video-room/${videoRoomId}`);
    }
  }, [history, recipientId, user, venue.id]);

  const { selectPrivateChat } = useChatSidebarControls();

  return (
    <div className="recipient-chat">
      <div className="recipient-chat__breadcrumbs">
        <div className="recipient-chat__profile" onClick={selectPrivateChat}>
          <FontAwesomeIcon
            icon={faChevronLeft}
            className="recipient-chat__back-icon"
            size="sm"
          />
          <UserAvatar user={recipient} showStatus />
          <div className="recipient-chat__nickname">{recipient.partyName}</div>
        </div>
        <FontAwesomeIcon
          icon={faVideo}
          className="recipient-chat__video-icon"
          size="sm"
          onClick={startVideoRoom}
        />
      </div>
      <Chatbox
        messages={messagesToDisplay}
        sendMessage={sendMessageToSelectedRecipient}
        deleteMessage={deleteMessage}
        sendThreadReply={sendThreadReply}
        venue={venue}
      />
    </div>
  );
};
