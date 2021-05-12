import { useCallback, useMemo, useEffect } from "react";
import useSound from "use-sound";

import {
  sendPrivateMessage,
  setChatMessageRead,
  deletePrivateMessage,
} from "api/chat";

import newMessageSound from "assets/sounds/newmessage.m4a";

import {
  PreviewChatMessageMap,
  PrivateChatMessage,
  ChatTypes,
} from "types/chat";

import { privateChatMessagesSelector } from "utils/selectors";
import {
  chatSort,
  buildMessage,
  getPreviewChatMessageToDisplay,
  getMessageToDisplay,
  getPreviewChatMessage,
} from "utils/chat";
import { WithId, withId } from "utils/id";

import { useChatSidebarControls } from "hooks/chatSidebar";
import { usePrevious } from "hooks/usePrevious";

import { isLoaded, useFirestoreConnect } from "./useFirestoreConnect";
import { useSelector } from "./useSelector";
import { useUser } from "./useUser";
import { useRecentWorldUsers, useWorldUsersById } from "./users";

export const useConnectPrivateChatMessages = () => {
  const { user } = useUser();

  useFirestoreConnect(() => {
    if (!user?.uid) return [];

    return [
      {
        collection: "privatechats",
        doc: user.uid,
        subcollections: [{ collection: "chats" }],
        storeAs: "privateChatMessages",
      },
    ];
  });
};

export const usePrivateChatMessages = () => {
  useConnectPrivateChatMessages();

  const privateChatMessages = useSelector(privateChatMessagesSelector);
  usePrivateChatNotification(privateChatMessages || []);

  return useMemo(
    () => ({
      privateChatMessages: privateChatMessages ?? [],
      isUserPrivateChatsLoaded: isLoaded(privateChatMessages),
    }),
    [privateChatMessages]
  );
};

export const usePrivateChatPreviews = () => {
  const { user } = useUser();
  const { worldUsersById } = useWorldUsersById();
  const {
    privateChatMessages,
    isUserPrivateChatsLoaded,
  } = usePrivateChatMessages();

  const userId = user?.uid;

  const privateChatPreviewsMap = useMemo(
    () =>
      privateChatMessages.reduce<PreviewChatMessageMap>((acc, message) => {
        if (!userId) return acc;

        const { from: fromUserId, to: toUserId } = message;

        // Either `from` author or `to` author is Me. Filter me out
        const counterPartyUserId =
          fromUserId === userId ? toUserId : fromUserId;

        const counterPartyUser = worldUsersById[counterPartyUserId];

        // Filter out not existent users
        if (!counterPartyUser) return acc;

        if (counterPartyUserId in acc) {
          const previousMessage = acc[counterPartyUserId];

          // If the message is older, replace it with the more recent one
          if (previousMessage.ts_utc > message.ts_utc) return acc;

          return {
            ...acc,
            [counterPartyUserId]: getPreviewChatMessage({
              message,
              user: withId(counterPartyUser, counterPartyUserId),
            }),
          };
        }

        return {
          ...acc,
          [counterPartyUserId]: getPreviewChatMessage({
            message,
            user: withId(counterPartyUser, counterPartyUserId),
          }),
        };
      }, {}),
    [privateChatMessages, userId, worldUsersById]
  );

  return useMemo(
    () => ({
      privateChatPreviews: Object.values(privateChatPreviewsMap)
        .sort(chatSort)
        .map((message) =>
          getPreviewChatMessageToDisplay({ message, myUserId: userId })
        ),
      isPrivateChatPreviewsLoaded: isUserPrivateChatsLoaded,
    }),
    [privateChatPreviewsMap, userId, isUserPrivateChatsLoaded]
  );
};

export const useOnlineUsersToDisplay = () => {
  const { recentWorldUsers } = useRecentWorldUsers();
  const { user } = useUser();

  const userId = user?.uid;

  // Filter out self
  return useMemo(() => recentWorldUsers.filter((user) => user.id !== userId), [
    recentWorldUsers,
    userId,
  ]);
};

export const useNumberOfUnreadChats = () => {
  const { user } = useUser();
  const { privateChatPreviews } = usePrivateChatPreviews();

  const userId = user?.uid;

  return useMemo(
    () =>
      privateChatPreviews.filter(
        (chatPreview) => !chatPreview.isRead && chatPreview.from !== userId
      ).length,
    [privateChatPreviews, userId]
  );
};

export const useRecipientChat = (recipientId: string) => {
  const { worldUsersById } = useWorldUsersById();
  const { privateChatMessages } = usePrivateChatMessages();
  const { user } = useUser();

  const userId = user?.uid;
  const recipient = withId(worldUsersById[recipientId], recipientId);

  const sendMessageToSelectedRecipient = useCallback(
    (text: string) => {
      if (!userId) return;

      const message = buildMessage<PrivateChatMessage>({
        from: userId,
        text,
        to: recipientId,
      });

      sendPrivateMessage(message);
    },
    [userId, recipientId]
  );

  const messagesToDisplay = useMemo(
    () =>
      privateChatMessages
        .filter(
          (message) =>
            message.deleted !== true &&
            (message.to === recipientId || message.from === recipientId)
        )
        .sort(chatSort)
        .map((message) =>
          getMessageToDisplay<WithId<PrivateChatMessage>>({
            message,
            usersById: worldUsersById,
            myUserId: userId,
          })
        ),
    [privateChatMessages, recipientId, worldUsersById, userId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!userId) return;

      deletePrivateMessage({ userId, messageId });
    },
    [userId]
  );

  const markMessageRead = useCallback(
    (messageId: string) => {
      if (!userId) return;

      setChatMessageRead({ userId, messageId });
    },
    [userId]
  );

  return {
    sendMessageToSelectedRecipient,
    deleteMessage,
    markMessageRead,
    messagesToDisplay,
    recipient,
  };
};

export const usePrivateChatNotification = (
  privateChatMessages: WithId<PrivateChatMessage>[]
) => {
  const { user } = useUser();
  const userId = user?.uid;

  const { chatSettings } = useChatSidebarControls();

  const [play] = useSound(newMessageSound, {
    // `interrupt` ensures that if the sound starts again before it's
    // ended, it will truncate it. Otherwise, the sound can overlap.
    interrupt: true,
  });

  const privateChatMessagesSorted = useMemo(
    () => Object.values(privateChatMessages).sort(chatSort),
    [privateChatMessages]
  );

  const lastMessageTimestampSec = usePrevious(
    privateChatMessagesSorted[0]?.ts_utc.seconds
  );

  const currentChatUserId =
    chatSettings.openedChatType === ChatTypes.PRIVATE_CHAT
      ? chatSettings.recipientId
      : undefined;

  useEffect(() => {
    const shouldPlaySound = privateChatMessagesSorted.some((message) => {
      const isNewMessage = message?.ts_utc.seconds > lastMessageTimestampSec;
      const notRead = !message.isRead;
      const notFromMeOrCurrentChat = ![userId, currentChatUserId].includes(
        message.from
      );

      return isNewMessage && notRead && notFromMeOrCurrentChat;
    });

    if (shouldPlaySound) {
      play();
    }
  }, [
    privateChatMessagesSorted,
    currentChatUserId,
    play,
    lastMessageTimestampSec,
    userId,
  ]);
};
