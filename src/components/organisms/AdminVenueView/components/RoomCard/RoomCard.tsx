import React from "react";
import { Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faUserFriends,
  faEye,
  faHandPointer,
} from "@fortawesome/free-solid-svg-icons";

import { Room } from "types/rooms";
import { VenueEvent } from "types/venues";

import { WithId, WithVenueId } from "utils/id";

import { ButtonNG } from "components/atoms/ButtonNG/ButtonNG";
import { EventCard } from "components/organisms/AdminVenueView/components/EventCard/EventCard";
import { RoomIcon } from "components/organisms/AdminVenueView/components/RoomIcon/RoomIcon";
import { PrettyLink } from "components/organisms/AdminVenueView/components/PrettyLink/PrettyLink";

import "./RoomCard.scss";

interface RoomCardProps {
  room: Room;
  events?: WithVenueId<WithId<VenueEvent>>[];
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, events }) => {
  return (
    <div className="RoomCard__card">
      <div className="RoomCard__header">
        <RoomIcon src={room.image_url} className="RoomCard__icon" />
        <Card.Title className="RoomCard__title">{room.title}</Card.Title>
        <div className="RoomCard__counter">
          <FontAwesomeIcon icon={faUserFriends} />
          123
        </div>
        <div className="RoomCard__type">room type here</div>
        <div className="RoomCard__link">
          <PrettyLink to={room.url} />
        </div>
      </div>

      <EventCard events={events} />

      <div className="RoomCard__footer">
        <div className="RoomCard__footer--left">
          <ButtonNG iconOnly={true} iconName={faEye} />
          <ButtonNG iconOnly={true} iconName={faHandPointer} />
        </div>
        <div className="RoomCard__footer--right">
          <ButtonNG iconOnly={true} iconName={faCog} />
        </div>
      </div>
    </div>
  );
};
