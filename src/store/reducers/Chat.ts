import { ChatActions, ChatActionTypes } from "store/actions/Chat";
import { ChatTypes, ChatSettings } from "types/chat";

export type ChatState = {
  isChatSidebarVisible: boolean;
  settings: ChatSettings;
};

const initialChatState: ChatState = {
  isChatSidebarVisible: false,
  settings: {
    openedChatType: ChatTypes.VENUE_CHAT,
  },
};

export const chatReducer = (
  state = initialChatState,
  action: ChatActions
): ChatState => {
  switch (action.type) {
    case ChatActionTypes.SET_CHAT_SIDEBAR_VISIBILITY:
      const { isVisible: isChatSidebarVisible } = action.payload;
      return { ...state, isChatSidebarVisible };

    case ChatActionTypes.SET_VENUE_CHAT_TAB_OPENED: {
      const { openedChatType } = action.payload;

      return {
        ...state,
        settings: { openedChatType },
      };
    }

    case ChatActionTypes.SET_PRIVATE_CHAT_TAB_OPENED: {
      const { openedChatType, recipientId } = action.payload;

      return {
        ...state,
        settings: { openedChatType, recipientId },
      };
    }

    case ChatActionTypes.SET_TWITTER_TAB_OPEN: {
      const { openedChatType } = action.payload;

      return {
        ...state,
        settings: { openedChatType },
      };
    }

    default:
      return state;
  }
};
