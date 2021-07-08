import { useCallback, useEffect, useMemo } from "react";
import { useWindowSize } from "react-use";

import { LARGE_SCREEN_WIDTH, CHATBAR_NEVER_PINNED_TEMPLATES } from "settings";

import { AnyVenue } from "types/venues";

import {
  chatVisibilitySelector,
  selectedChatSettingsSelector,
} from "utils/selectors";

import {
  setPrivateChatTabOpened,
  setVenueChatTabOpened,
  setChatSidebarVisibility,
} from "store/actions/Chat";

import { useSelector } from "./useSelector";
import { useDispatch } from "./useDispatch";
import { useNumberOfUnreadChats } from "./privateChats";
import { AnyVenue } from "types/venues";

export const useChatSidebarControls = () => {
  const dispatch = useDispatch();
  const isExpanded = useSelector(chatVisibilitySelector);
  const chatSettings = useSelector(selectedChatSettingsSelector);

  const expandSidebar = useCallback(() => {
    dispatch(setChatSidebarVisibility(true));
  }, [dispatch]);

  const collapseSidebar = useCallback(() => {
    dispatch(setChatSidebarVisibility(false));
  }, [dispatch]);

  const toggleSidebar = useCallback(() => {
    if (isExpanded) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  }, [expandSidebar, collapseSidebar, isExpanded]);

  const selectVenueChat = useCallback(() => {
    expandSidebar();
    dispatch(setVenueChatTabOpened());
  }, [dispatch, expandSidebar]);

  const selectPrivateChat = useCallback(() => {
    expandSidebar();
    dispatch(setPrivateChatTabOpened());
  }, [dispatch, expandSidebar]);

  const selectRecipientChat = useCallback(
    (recipientId: string) => {
      expandSidebar();
      dispatch(setPrivateChatTabOpened(recipientId));
    },
    [dispatch, expandSidebar]
  );

  return {
    isExpanded,
    chatSettings,

    expandSidebar,
    selectVenueChat,
    selectPrivateChat,
    selectRecipientChat,
    collapseSidebar,
    toggleSidebar,
  };
};

export const useChatSidebarInfo = (venue: AnyVenue) => {
  const numberOfUnreadChats = useNumberOfUnreadChats();
  const chatTitle = venue?.chatTitle ?? "Venue";

  return {
    privateChatTabTitle: `Direct Messages ${
      numberOfUnreadChats ? `(${numberOfUnreadChats})` : ""
    }`,
    venueChatTabTitle: `${chatTitle} Chat`,
  };
};

export const useChatSidebarPinned = (venue: AnyVenue) => {
  const dispatch = useDispatch();
  const { width } = useWindowSize();
  const isPinned = useMemo(
    () =>
      width > LARGE_SCREEN_WIDTH &&
      !CHATBAR_NEVER_PINNED_TEMPLATES.includes(venue?.template),
    [width, venue]
  );

  useEffect(() => {
    if (isPinned) {
      dispatch(setChatSidebarVisibility(true));
    }
  }, [dispatch, isPinned]);

  return {
    isPinned,
  };
};
