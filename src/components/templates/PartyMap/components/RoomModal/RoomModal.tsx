import React, { useCallback, useMemo } from "react";
import { Modal } from "react-bootstrap";

import { Room, RoomType } from "types/rooms";
import { AnyVenue, VenueEvent } from "types/venues";

import { retainAttendance } from "store/actions/Attendance";

import { isEventLive } from "utils/event";
import { WithId, WithVenueId } from "utils/id";

import { useDispatch } from "hooks/useDispatch";
import { useCustomSound } from "hooks/sounds";
import { useRoom } from "hooks/useRoom";

import { RenderMarkdown } from "components/organisms/RenderMarkdown";
import VideoModal from "components/organisms/VideoModal";

import { UserList } from "components/molecules/UserList";

import { RoomModalOngoingEvent, ScheduleItem } from "..";

import "./RoomModal.scss";

const emptyEvents: WithVenueId<WithId<VenueEvent>>[] = [];

export interface RoomModalProps {
  onHide: () => void;
  show: boolean;
  venue?: AnyVenue;
  room?: Room;
  venueEvents?: WithVenueId<WithId<VenueEvent>>[];
}

export const RoomModal: React.FC<RoomModalProps> = ({
  onHide,
  room,
  show,
  venue,
  venueEvents = emptyEvents,
}) => {
  if (!venue || !room) return null;

  if (room.type === RoomType.modalFrame) {
    return (
      <VideoModal
        show={show}
        onHide={onHide}
        caption={room.title}
        url={room.url}
        autoplay
        backdrop
      />
    );
  }

  return (
    <Modal show={show} onHide={onHide}>
      <div className="room-modal">
        <RoomModalContent
          room={room}
          venueName={venue.name}
          venueEvents={venueEvents}
        />
      </div>
    </Modal>
  );
};

export interface RoomModalContentProps {
  room: Room;
  venueName: string;
  venueEvents: WithVenueId<WithId<VenueEvent>>[];
}

export const RoomModalContent: React.FC<RoomModalContentProps> = ({
  room,
  venueName,
  venueEvents,
}) => {
  const dispatch = useDispatch();

  // @debt do we need to keep this retainAttendance stuff (for counting feature), or is it legacy tech debt?
  const triggerAttendance = useCallback(() => {
    dispatch(retainAttendance(true));
  }, [dispatch]);

  // @debt do we need to keep this retainAttendance stuff (for counting feature), or is it legacy tech debt?
  const clearAttendance = useCallback(() => {
    dispatch(retainAttendance(false));
  }, [dispatch]);

  const { enterRoom, recentRoomUsers } = useRoom({ room, venueName });

  const [_enterRoomWithSound] = useCustomSound(room.enterSound, {
    interrupt: true,
    onend: enterRoom,
  });

  // note: this is here just to change the type on it in an easy way
  const enterRoomWithSound: () => void = _enterRoomWithSound;

  const renderedRoomEvents = useMemo(() => {
    return venueEvents.map((event, index: number) => (
      <ScheduleItem
        // @debt Ideally event.id would always be a unique identifier, but our types suggest it
        //   can be undefined. Because we can't use index as a key by itself (as that is unstable
        //   and causes rendering issues, we construct a key that, while not guaranteed to be unique,
        //   is far less likely to clash
        key={event.id ?? `${event.room}-${event.name}-${index}`}
        event={event}
        isCurrentEvent={isEventLive(event)}
        onRoomEnter={enterRoomWithSound}
        roomUrl={room.url}
      />
    ));
  }, [enterRoomWithSound, room.url, venueEvents]);

  // @debt do we want to show/hide the schedule on RoomModal based on venue.showSchedule?
  const hasRoomEvents = renderedRoomEvents?.length > 0;

  const iconStyles = {
    backgroundImage: room.image_url ? `url(${room.image_url})` : undefined,
  };

  return (
    <>
      <h2>{room.title}</h2>

      {room.subtitle && (
        <div className="room-modal__title">{room.subtitle}</div>
      )}

      <div className="room-modal__main">
        <div className="room-modal__icon" style={iconStyles} />
        {/* @debt do we want to show/hide the schedule on RoomModal based on venue.showSchedule? */}

        <div className="room-modal__content">
          <RoomModalOngoingEvent roomEvents={venueEvents} />

          <button
            className="btn btn-primary room-modal__btn-enter"
            onMouseOver={triggerAttendance}
            onMouseOut={clearAttendance}
            onClick={enterRoomWithSound}
          >
            Enter
          </button>
        </div>
      </div>

      <UserList
        containerClassName="room-modal__userlist"
        users={recentRoomUsers}
        limit={11}
        activity="in this room"
        attendanceBoost={room.attendanceBoost}
      />

      {room.about && (
        <div className="room-modal__description">
          <RenderMarkdown text={room.about} />
        </div>
      )}

      {/* @debt do we want to show/hide the schedule on RoomModal based on venue.showSchedule? */}
      {hasRoomEvents && (
        <div className="room-modal__events">
          <div className="room-modal__title">Room Schedule</div>

          {renderedRoomEvents}
        </div>
      )}
    </>
  );
};
