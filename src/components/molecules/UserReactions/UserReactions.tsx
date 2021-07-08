import React, { useEffect, useMemo } from "react";
import { useCss } from "react-use";
import classNames from "classnames";
import { getSeconds } from "date-fns";

import { REACTION_TIMEOUT } from "settings";

import {
  isTextReaction,
  ReactionData,
  EmojiReactionType,
} from "types/reactions";

import { uniqueEmojiReactionsDataMapReducer } from "utils/reactions";

import { useReactions } from "hooks/reactions";
import { useSelector } from "hooks/useSelector";
import { useAudio } from "hooks/audio/useAudio";

import "./UserReactions.scss";

const REACTION_TIMEOUT_CSS = `${getSeconds(REACTION_TIMEOUT)}s`;

export interface UserReactionsProps {
  userId: string;
  isMuted?: boolean;
  reactionPosition?: "left" | "right";
}

export const UserReactions: React.FC<UserReactionsProps> = ({
  userId,
  isMuted: isMutedLocally = false,
  reactionPosition,
  children,
}) => {
  // @debt some of the redux patterns exist for this, but I don't believe anything actually uses them/calls this at the moment. Used in MapPartygoersOverlay
  const isMutedGlobally = useSelector((state) => state.room.mute);
  const isMuted = isMutedLocally || isMutedGlobally;

  const userReactions = useReactions({
    userId,
  });

  const { renderedEmojiReactions, userShoutout } = useMemo(() => {
    const userUniqueEmojiReactions = userReactions.reduce(
      uniqueEmojiReactionsDataMapReducer,
      new Map()
    );

    const renderedEmojiReactions = Array.from(
      userUniqueEmojiReactions.values()
    ).map((emojiReaction) => (
      <DisplayEmojiReaction
        key={emojiReaction.type}
        emojiReaction={emojiReaction}
        isMuted={isMuted}
      />
    ));

    const userShoutout = userReactions.find(isTextReaction);

    return { renderedEmojiReactions, userShoutout };
  }, [isMuted, userReactions]);

  const containerVars = useCss({
    "--user-reactions-reaction-timeout": REACTION_TIMEOUT_CSS,
  });

  const containerClasses = classNames(
    "UserReactions",
    `UserReactions--reaction-${reactionPosition}`,
    containerVars
  );

  return (
    <div className={containerClasses}>
      {children}

      {renderedEmojiReactions}

      {userShoutout && (
        <div className="UserReactions__shout">{userShoutout.text}</div>
      )}
    </div>
  );
};

export interface EmojiReactionProps {
  emojiReaction: ReactionData<EmojiReactionType>;
  isMuted?: boolean;
}

export const DisplayEmojiReaction: React.FC<EmojiReactionProps> = ({
  emojiReaction,
  isMuted = false,
}) => {
  const { ariaLabel, text: emojiText, audioPath } = emojiReaction;
  useAudio({ audioPath, isMuted });

  useEffect(() => {
    if (isMuted) return;

    const audio = new Audio(audioPath);

    audio.play();

    return () => {
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio#memory_usage_and_management
      //   the audio will keep playing and the object will remain in memory until playback ends or is paused (such as by calling pause()).
      //   At that time, the object becomes subject to garbage collection.
      audio.pause();
    };
  }, [audioPath, isMuted]);

  return (
    <div className="UserReactions__reaction" role="img" aria-label={ariaLabel}>
      {emojiText}
    </div>
  );
};
