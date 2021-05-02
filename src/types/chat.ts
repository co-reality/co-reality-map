import { WithId } from "utils/id";
import { User } from "types/User";

export type BaseChatMessage = {
  from: string;
  text: string;
  ts_utc: firebase.firestore.Timestamp;
  deleted?: boolean;
};

export type PrivateChatMessage = BaseChatMessage & {
  to: string;
  isRead?: boolean;
};

export type VenueChatMessage = BaseChatMessage & {};

export type ChatMessage = PrivateChatMessage | VenueChatMessage;

export type MessageToDisplay<T extends ChatMessage = ChatMessage> = T & {
  author: WithId<User>;
  isMine: boolean;
  canBeDeleted?: boolean;
};

export type PreviewChatMessage = PrivateChatMessage & {
  counterPartyUser: WithId<User>;
};

export type PreviewChatMessageMap = { [key: string]: PreviewChatMessage };

export type PreviewChatMessageToDisplay = PreviewChatMessage & {
  isMine: boolean;
};

export enum ChatTypes {
  WORLD_CHAT = "WORLD_CHAT",
  VENUE_CHAT = "VENUE_CHAT",
  PRIVATE_CHAT = "PRIVATE_CHAT",
  TWITTER = "TWITTER",
}

export type PrivateChatSettings = {
  openedChatType: ChatTypes.PRIVATE_CHAT;
  recipientId?: string;
};

export type VenueChatSettings = {
  openedChatType: ChatTypes.VENUE_CHAT;
};

export type TwitterSettings = {
  openedChatType: ChatTypes.TWITTER;
};

export type ChatSettings =
  | PrivateChatSettings
  | VenueChatSettings
  | TwitterSettings;

// @debt Remove it when UserProfileModal is refactored
export type SetSelectedProfile = (user: WithId<User>) => void;
