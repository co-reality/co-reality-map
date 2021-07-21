import React, { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";

import { EVENT_STATUS_REFRESH_MS } from "settings";

import { Room } from "types/rooms";
import { VenueEvent } from "types/venues";

import { getEventStatus, isEventLive } from "utils/event";
import { WithVenueId } from "utils/id";
import {
  enterVenue,
  openUrl,
  getUrlWithoutTrailingSlash,
  getLastUrlParam,
  getUrlParamFromString,
} from "utils/url";

import { useInterval } from "hooks/useInterval";
import { useRelatedVenues } from "hooks/useRelatedVenues";
import { useRoom } from "hooks/useRoom";

import { Button } from "components/atoms/Button";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import "./EventModal.scss";

export interface EventModalProps {
  show: boolean;
  onHide: () => void;
  event: WithVenueId<VenueEvent>;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  onHide,
  show,
}) => {
  const { currentVenue: eventVenue } = useRelatedVenues({
    currentVenueId: event.venueId,
  });

  const eventRoom = useMemo<Room | undefined>(
    () =>
      eventVenue?.rooms?.find((room) => {
        const { room: eventRoom = "" } = event;

        const noTrailSlashUrl = getUrlWithoutTrailingSlash(room.url);

        const [roomName] = getLastUrlParam(noTrailSlashUrl);
        const roomUrlParam = getUrlParamFromString(eventRoom);

        return roomUrlParam.endsWith(`${roomName}`);
      }),
    [eventVenue, event]
  );

  const { enterRoom } = useRoom({
    room: eventRoom,
    venueName: eventVenue?.name ?? "",
  });

  const eventLocationToDisplay =
    (event.room || eventVenue?.name) ?? event.venueId;

  const goToEventLocation = () => {
    onHide();

    const { room = "" } = event;
    const roomUrlParam = getUrlParamFromString(room);

    if (!eventRoom) {
      openUrl(roomUrlParam);

      return;
    }

    if (event.room) {
      enterRoom();
    } else {
      enterVenue(event.venueId);
    }
  };

  const isLive = isEventLive(event);

  const [eventStatus, setEventStatus] = useState(getEventStatus(event));
  useInterval(
    () => setEventStatus(getEventStatus(event)),
    EVENT_STATUS_REFRESH_MS
  );

  return (
    <Modal show={show} onHide={onHide} className="EventModal">
      <div className="EventModal__content">
        <h4 className="EventModal__title">{event.name}</h4>
        <span className="EventModal__subtitle">
          by {event.host} in{" "}
          <button className="button--a" onClick={goToEventLocation}>
            {eventLocationToDisplay}
          </button>
        </span>

        <div className="EventModal__description">
          <RenderMarkdown text={event.description} />
        </div>

        <Button
          customClass="EventModal__button"
          onClick={goToEventLocation}
          disabled={!isLive}
        >
          {eventStatus} in the {eventLocationToDisplay}
        </Button>
      </div>
    </Modal>
  );
};
