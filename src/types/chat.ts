import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faPoll, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { User } from "types/User";
import { WithId } from "utils/id";
import firebase from "firebase/app";

export enum ChatMessageType {
  poll = "poll",
}

export type BaseChatMessage = {
  from: string;
  text: string;
  ts_utc: firebase.firestore.Timestamp;
  deleted?: boolean;
  threadId?: string;
  isQuestion?: boolean;
  isVideo?: boolean;
};

export type PrivateChatMessage = BaseChatMessage & {
  to: string;
  isRead?: boolean;
};

export type VenueChatMessage = BaseChatMessage;

export type PollMessage = BaseChatMessage & {
  type: ChatMessageType.poll;
  poll: PollValues;
  votes: PollVote[];
};

export type PollVoteBase = {
  questionId: number;
  pollId: string;
};

export type PollVote = PollVoteBase & {
  userId: string;
};

export type ChatMessage = PrivateChatMessage | VenueChatMessage | PollMessage;

export type BaseMessageToDisplay<T extends ChatMessage = ChatMessage> = T & {
  author: WithId<User>;
  isMine: boolean;
  // @debt remove this from Types. It should be decided in the in-component level
  canBeDeleted?: boolean;
};

export type MessageToDisplay<
  T extends ChatMessage = ChatMessage
> = BaseMessageToDisplay<T> & {
  replies: WithId<BaseMessageToDisplay<T>>[];
};

export interface SendMessageProps {
  message: string;
  isQuestion?: boolean;
}

export type SendMessage = (
  sendMessageProps: SendMessageProps
) => Promise<void> | undefined;

export type DeleteMessage = (messageId: string) => Promise<void> | undefined;

export interface SendChatReplyProps {
  replyText: string;
  threadId: string;
}

export type SendChatReply = (
  props: SendChatReplyProps
) => Promise<void> | undefined;

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
}

export type PrivateChatSettings = {
  openedChatType: ChatTypes.PRIVATE_CHAT;
  recipientId?: string;
};

export type VenueChatSettings = {
  openedChatType: ChatTypes.VENUE_CHAT;
};

export type ChatSettings = PrivateChatSettings | VenueChatSettings;

export enum ChatOptionType {
  poll = "poll",
  question = "question",
}

export interface ChatOption {
  type: ChatOptionType;
  icon: IconDefinition;
  name: string;
}

export type PollQuestion = {
  name: string;
  id: number;
};

export type PollValues = {
  topic: string;
  questions: PollQuestion[];
};

export const ChatMessageOptions: ChatOption[] = [
  {
    type: ChatOptionType.poll,
    icon: faPoll,
    name: "Create Poll",
  },
  {
    type: ChatOptionType.question,
    icon: faQuestion,
    name: "Ask Question",
  },
];
