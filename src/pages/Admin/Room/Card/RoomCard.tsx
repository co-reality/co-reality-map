import React from "react";
import { Card } from "react-bootstrap";

import { RoomInput_v2, updateRoom } from "api/admin";

import { RoomCardProps } from "./RoomCard.types";

import { useSelector } from "hooks/useSelector";
import { useUser } from "hooks/useUser";

import VenueEventDetails from "pages/Admin/VenueEventDetails";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";

import { Button } from "components/atoms/Button";
import { Checkbox } from "components/atoms/Checkbox";

import * as S from "./RoomCard.styles";

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  roomIndex,
  venueId,
  editHandler,
  onEventHandler,
}) => {
  const { user } = useUser();
  const events = useSelector((state) => state.firestore.ordered.events);
  const filteredEvents =
    events &&
    events.filter((e) => {
      if (e.room === room.title) {
        return e;
      }
      return null;
    });

  if (!user) return null;

  const renderFilteredEvents = () => {
    return filteredEvents?.map((venueEvent) => (
      <VenueEventDetails
        key={venueEvent.id}
        venueEvent={venueEvent}
        setEditedEvent={() => {}}
        setShowCreateEventModal={() => {}}
        setShowDeleteEventModal={() => {}}
        className="admin-room-list-events"
      />
    ));
  };

  const handleRoomVisibilityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const roomValues: RoomInput_v2 = {
      ...room,
      isEnabled: e.target.checked,
    };

    updateRoom(roomValues, venueId, user, roomIndex);
  };

  return (
    <S.Wrapper>
      <S.Header>
        <S.Banner>
          <img src={room.image_url} alt="Room banner" />
        </S.Banner>

        <S.TitleWrapper>
          <S.Title>{room.title}</S.Title>
          <S.Description>
            {<RenderMarkdown text={room.description} />}
          </S.Description>
        </S.TitleWrapper>

        <S.ButtonWrapper>
          <Button onClick={() => editHandler()}>Edit room</Button>

          {/* Temporary div/toggle, this will be select element once the isEnabled is reworked */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "1rem",
            }}
          >
            <Checkbox
              name="showGrid"
              checked={room.isEnabled}
              onChange={handleRoomVisibilityChange}
              label={room.isEnabled ? "Room Enabled" : "Room Disabled"}
              toggler
            />
          </div>
        </S.ButtonWrapper>
      </S.Header>

      <Card.Subtitle>Events</Card.Subtitle>
      {!filteredEvents || !filteredEvents.length ? (
        <S.EventWrapper>No events yet</S.EventWrapper>
      ) : (
        renderFilteredEvents()
      )}
      <Button onClick={() => onEventHandler(room!.title!)}>Add an event</Button>
    </S.Wrapper>
  );
};

export default RoomCard;
