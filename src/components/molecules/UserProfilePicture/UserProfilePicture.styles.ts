import styled, { css, keyframes } from "styled-components";

import { DEFAULT_PROFILE_IMAGE } from "settings";

// --- Avatar
type AvatarProps = {
  backgroundImage?: string;
};

export const Avatar = styled.div<AvatarProps>`
  background-size: cover;
  width: 4vh;
  height: 4vh;
  background-image: url(${({ backgroundImage }) =>
    backgroundImage ?? DEFAULT_PROFILE_IMAGE});
`;

// --- Reaction
const reactionOffset = "-20px";

const reactionLeft = css`
  left: ${reactionOffset};
`;

const reactionRight = css`
  right: ${reactionOffset};
`;

type ReactionProps = {
  reactionPosition?: "right" | "left" | undefined;
};

export const Reaction = styled.div<ReactionProps>`
  position: absolute;

  width: 50px;

  ${({ reactionPosition }) =>
    reactionPosition === "right" ? reactionRight : reactionLeft};
  bottom: 0;

  font-size: 50px;

  animation: pulse 4s ease-in-out infinite;
`;

// --- Reaction Container
export const Container = styled.div`
  height: 100%;

  background-position: center;
  background-size: cover;

  .reaction-container {
    position: relative;
  }

  ${Avatar} {
    border-radius: 10rem;
  }

  .on-right {
    ${Reaction} {
      right: unset;
      left: -20px;
    }
  }
`;

// --- Shout-out message
const translateXOffset = "5vh"; // 5vh = imageWidth (4vh) + 1v (padding)

const expandBounceRight = keyframes`
  0%,
  100% {
    transform: scale(0) translateX(0);
  }

  25% {
    transform: scale(1.25) translateX(${translateXOffset});
  }

  40%,
  80% {
    transform: scale(1) translateX(${translateXOffset});
  }
`;

const expandBounceLeft = keyframes`
  0%,
  100% {
    transform: scale(0) translateX(0);
  }

  25% {
    transform: scale(1.25) translateX(-${translateXOffset});
  }

  40%,
  80% {
    transform: scale(1) translateX(-${translateXOffset});
  }
`;

const messageLeft = css`
  right: 0;
  transform-origin: right center;
  animation: ${expandBounceLeft} 5s ease;
`;

const messageRight = css`
  left: 0;
  transform-origin: 2vh center;
  animation: ${expandBounceRight} 5s ease;
`;

export const ShoutOutMessage = styled.div<ReactionProps>`
  bottom: 0;
  position: absolute;
  z-index: 1;

  width: max-content;
  max-width: 20em;
  padding: 6px 10px;

  ${({ reactionPosition }) =>
    reactionPosition === "right" ? messageRight : messageLeft};

  background-color: rgba(255, 255, 255, 1);

  color: #000;
  font-size: 20px;
  border-radius: 10px;
`;
