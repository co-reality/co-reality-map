import React, { useCallback, useMemo } from "react";
import { Modal } from "react-bootstrap";

import { Room } from "types/rooms";

import { getCurrentEvent } from "utils/event";
import { enterVenueRoom, enterExternalRoom } from "utils/userLocation";
import { orderedVenuesSelector, venueEventsSelector } from "utils/selectors";
import {
  getCurrentTimeInMilliseconds,
  getCurrentTimeInUnixEpochSeconds,
  ONE_MINUTE_IN_SECONDS,
} from "utils/time";

import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { useRecentRoomUsers } from "hooks/users";

import UserList from "components/molecules/UserList";

import { RoomModalOngoingEvent, ScheduleItem } from "..";

import "./RoomModal.scss";

interface RoomModalProps {
  show: boolean;
  onHide: () => void;
  room?: Room;
}

export const RoomModal: React.FC<RoomModalProps> = ({ show, onHide, room }) => {
  const { user } = useUser();
  const userId = user?.uid;

  const venues = useSelector(orderedVenuesSelector);
  const venueEvents = useSelector(venueEventsSelector) ?? [];

  const roomVenue = useMemo(() => {
    if (!room) return undefined;

    return venues?.find((venue) => room.url.endsWith(`/${venue.id}`));
  }, [room, venues]);

  // const getRoomTitle = (room, venues) => {
  //   const roomVenue = venues?.find((venue) => room.url.endsWith(`/${venue.id}`));
  // }

  const { recentRoomUsers } = useRecentRoomUsers(room);

  const enterRoom = useCallback(() => {
    if (!userId || !room) return;

    if (roomVenue !== undefined) {
      enterVenueRoom({
        userId,
        venueName: roomVenue.name,
        venueId: roomVenue.id,
      });

      return;
    }

    enterExternalRoom({ userId, room });
  }, [room, userId]);

  const roomEvents = useMemo(() => {
    if (!room) return [];

    return venueEvents.filter(
      (event) =>
        event.room === room.title &&
        event.start_utc_seconds +
          event.duration_minutes * ONE_MINUTE_IN_SECONDS >
          getCurrentTimeInUnixEpochSeconds()
    );
  }, [room, venueEvents]);

  const currentEvent = roomEvents && getCurrentEvent(roomEvents);

  // @debt Note: By not rendering like this when room isn't set, we prevent the 'modal closing' transition from running
  if (!room) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide}>
      <div className="container room-modal-container">
        <div className="room-description">
          <div className="title-container">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              <h2 className="room-modal-title">{room.title}</h2>
              <div className="room-modal-subtitle">{room.subtitle}</div>
            </div>

            <div className="row ongoing-event-row">
              <div className="col">
                {room.image_url && (
                  <img
                    src={room.image_url}
                    className="room-page-image"
                    alt={room.title}
                  />
                )}
                {!room.image_url && room.title}
              </div>
              <div className="col">
                <RoomModalOngoingEvent
                  roomTitle={room.title}
                  roomEvents={roomEvents}
                  onRoomEnter={enterRoom}
                />
              </div>
            </div>
          </div>
        </div>

        <UserList
          users={recentRoomUsers}
          limit={11}
          activity="in this room"
          attendanceBoost={room.attendanceBoost}
        />

        {room.about && <div className="about-this-room">{room.about}</div>}

        <div className="row">
          {roomEvents && roomEvents.length > 0 && (
            <div className="col schedule-container">
              <div className="schedule-title">Room Schedule</div>
              {roomEvents.map((event, index: number) => (
                <ScheduleItem
                  // @debt Ideally event.id would always be a unique identifier, but our types suggest it
                  //   can be undefined. Because we can't use index as a key by itself (as that is unstable
                  //   and causes rendering issues, we construct a key that, while not guaranteed to be unique,
                  //   is far less likely to clash
                  key={event.id ?? `${event.room}-${event.name}-${index}`}
                  event={event}
                  isCurrentEvent={
                    currentEvent && event.name === currentEvent.name
                  }
                  onRoomEnter={enterRoom}
                  roomUrl={room.url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
