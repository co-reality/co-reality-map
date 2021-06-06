import React from "react";

import { AnyVenue } from "types/venues";

import { WithId } from "utils/id";

import { useVenueChat } from "hooks/useVenueChat";
import { useChatSidebarControls } from "hooks/chatSidebar";

import { Chatbox } from "components/molecules/Chatbox";

import "./VenueChat.scss";

export interface VenueChatProps {
  venue: WithId<AnyVenue>;
}

export const VenueChat: React.FC<VenueChatProps> = ({ venue }) => {
  const {
    sendMessage,
    deleteMessage,
    messagesToDisplay,
    sendThreadReply,
  } = useVenueChat(venue.id);
  const { selectVenueChat } = useChatSidebarControls();

  return (
    <div className="venue-chat" onClick={selectVenueChat}>
      <Chatbox
        // poll is available for Venue Chat only (displayPoll = true)
        displayPoll
        messages={messagesToDisplay}
        sendMessage={sendMessage}
        sendThreadReply={sendThreadReply}
        deleteMessage={deleteMessage}
        venue={venue}
      />
    </div>
  );
};
