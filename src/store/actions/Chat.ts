import {
  VenueChatSettings,
  PrivateChatSettings,
  TwitterSettings,
  ChatTypes,
} from "types/chat";
import { ReduxAction } from "types/redux";

export enum ChatActionTypes {
  SET_CHAT_SIDEBAR_VISIBILITY = "SET_CHAT_SIDEBAR_VISIBILITY",
  SET_VENUE_CHAT_TAB_OPENED = "SET_VENUE_CHAT_TAB_OPENED",
  SET_PRIVATE_CHAT_TAB_OPENED = "SET_PRIVATE_CHAT_TAB_OPENED",
  SET_TWITTER_TAB_OPEN = "SET_TWITTER_TAB_OPEN",
}

export type SetChatsSidebarVisibilityAction = ReduxAction<
  ChatActionTypes.SET_CHAT_SIDEBAR_VISIBILITY,
  { isVisible: boolean }
>;

export type SetVenueChatTabOpenedAction = ReduxAction<
  ChatActionTypes.SET_VENUE_CHAT_TAB_OPENED,
  VenueChatSettings
>;

export type SetPrivateChatTabOpenedAction = ReduxAction<
  ChatActionTypes.SET_PRIVATE_CHAT_TAB_OPENED,
  PrivateChatSettings
>;

export type SetTwitterTabOpenedAction = ReduxAction<
  ChatActionTypes.SET_TWITTER_TAB_OPEN,
  TwitterSettings
>;

export const setChatSidebarVisibility = (
  isVisible: boolean
): SetChatsSidebarVisibilityAction => ({
  type: ChatActionTypes.SET_CHAT_SIDEBAR_VISIBILITY,
  payload: { isVisible },
});

export const setVenueChatTabOpened = (): SetVenueChatTabOpenedAction => ({
  type: ChatActionTypes.SET_VENUE_CHAT_TAB_OPENED,
  payload: {
    openedChatType: ChatTypes.VENUE_CHAT,
  },
});

export const setPrivateChatTabOpened = (
  recipientId?: string
): SetPrivateChatTabOpenedAction => ({
  type: ChatActionTypes.SET_PRIVATE_CHAT_TAB_OPENED,
  payload: {
    openedChatType: ChatTypes.PRIVATE_CHAT,
    recipientId,
  },
});

export const setTwitterTabOpened = (): SetTwitterTabOpenedAction => ({
  type: ChatActionTypes.SET_TWITTER_TAB_OPEN,
  payload: {
    openedChatType: ChatTypes.TWITTER,
  },
});

export type ChatActions =
  | SetChatsSidebarVisibilityAction
  | SetVenueChatTabOpenedAction
  | SetTwitterTabOpenedAction
  | SetPrivateChatTabOpenedAction;
