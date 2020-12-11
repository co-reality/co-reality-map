import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  FC,
  useCallback,
} from "react";

import { VENUE_CHAT_AGE_DAYS } from "settings";

import { getDaysAgoInSeconds, roundToNearestHour } from "utils/time";
import {
  currentVenueSelectorData,
  venueChatsSelector,
  venueUsersDataSelector,
} from "utils/selectors";

import useRoles from "hooks/useRoles";
import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { useVenueId } from "hooks/useVenueId";
import { useConnectVenueUsers } from "hooks/useConnectVenueUsers";

import { ChatContext, chatSort } from "components/context/ChatContext";
import ChatBox from "components/molecules/Chatbox";

import "./VenueChat.scss";

interface ChatOutDataType {
  messageToTheBand: string;
}

const VenueChat: FC = () => {
  useConnectVenueUsers();

  const venueId = useVenueId();
  const venueUsers = useSelector(venueUsersDataSelector) ?? {};
  const { userRoles } = useRoles();
  const { user } = useUser();

  const chats = useSelector(venueChatsSelector);
  const venue = useSelector(currentVenueSelectorData);

  const [isMessageToTheBarSent, setIsMessageToTheBarSent] = useState(false);

  useEffect(() => {
    if (isMessageToTheBarSent) {
      setTimeout(() => {
        setIsMessageToTheBarSent(false);
      }, 2000);
    }
  }, [isMessageToTheBarSent]);

  const chatContext = useContext(ChatContext);

  const submitMessage = useCallback(
    async (data: ChatOutDataType) => {
      chatContext &&
        user &&
        chatContext.sendRoomChat(user.uid, venueId!, data.messageToTheBand);
    },
    [chatContext, user, venueId]
  );

  const DAYS_AGO = getDaysAgoInSeconds(VENUE_CHAT_AGE_DAYS);
  const HIDE_BEFORE = roundToNearestHour(DAYS_AGO);

  const chatsToDisplay = useMemo(
    () =>
      chats &&
      chats
        .filter(
          (message) =>
            message.deleted !== true &&
            message.type === "room" &&
            message.to === venueId &&
            message.ts_utc.seconds > HIDE_BEFORE
        )
        .sort(chatSort),
    [chats, venueId, HIDE_BEFORE]
  );

  const allowDelete = useMemo(() => {
    return (
      ((userRoles && userRoles.includes("admin")) ||
        (user && venue?.owners?.includes(user.uid))) ??
      false
    );
  }, [user, userRoles, venue]);

  return (
    <ChatBox
      usersById={venueUsers}
      allowDelete={allowDelete}
      chats={chatsToDisplay}
      onMessageSubmit={submitMessage}
      emptyListMessage="Be the first to publish in the chat"
    />
  );
};

export default VenueChat;
