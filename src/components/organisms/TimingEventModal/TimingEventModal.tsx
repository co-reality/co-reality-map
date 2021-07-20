import React, { useCallback, useEffect } from "react";
import dayjs from "dayjs";

import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { eventEditSchema } from "pages/Admin/Details/ValidationSchema";

import { VenueEvent, VenueTemplate, AnyVenue } from "types/venues";

import { createEvent, EventInput, updateEvent } from "api/admin";

import { HAS_ROOMS_TEMPLATES } from "settings";

import { WithId } from "utils/id";

import "./TimingEventModal.scss";

export type TimingEventModalProps = {
  show: boolean;
  onHide: () => void;
  venueId: string | undefined;
  event?: WithId<VenueEvent>;
  template?: VenueTemplate;
  venue: WithId<AnyVenue>;
  setEditedEvent: Function | undefined;
  setShowDeleteEventModal: Function;
};

export const TimingEventModal: React.FC<TimingEventModalProps> = ({
  show,
  onHide,
  venueId,
  template,
  venue,
  setEditedEvent,
  event,
  setShowDeleteEventModal,
}) => {
  const {
    register,
    handleSubmit,
    errors,
    formState,
    reset,
  } = useForm<EventInput>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    validationSchema: eventEditSchema,
  });

  useEffect(() => {
    if (event) {
      reset({
        name: event.name,
        description: event.description,
        start_date: dayjs.unix(event.start_utc_seconds).format("YYYY-MM-DD"),
        start_time: dayjs.unix(event.start_utc_seconds).format("HH:mm"),
        duration_hours: Math.floor(event.duration_minutes / 60),
        duration_minutes: event.duration_minutes % 60,
        host: event.host,
        room: event.room,
      });
    }
  }, [event, reset]);

  const onUpdateEvent = useCallback(
    async (data: EventInput) => {
      const start = dayjs(`${data.start_date} ${data.start_time}`);
      const formEvent: VenueEvent = {
        name: data.name,
        description: data.description,
        start_utc_seconds:
          start.unix() || Math.floor(new Date().getTime() / 1000),
        duration_minutes: data.duration_hours * 60 + data.duration_minutes,
        price: 0,
        collective_price: 0,
        host: data.host,
      };
      if (template && HAS_ROOMS_TEMPLATES.includes(template))
        formEvent.room = data.room;
      if (event) {
        await updateEvent(venueId!, event.id, formEvent);
      } else {
        await createEvent(venueId!, formEvent);
      }
      onHide();
    },
    [onHide, venueId, template, event]
  );

  const rooms = venue.rooms ?? [];

  return (
    <>
      <Modal show={show} onHide={onHide} className="TimingEventModal">
        <Modal.Body>
          <div className="form-container">
            <h2>Create an event</h2>
            <form className="form" onSubmit={handleSubmit(onUpdateEvent)}>
              <div className="input-group dropdown-container">
                <select
                  name="room"
                  id="room"
                  className="input-group__modal-input input-group__dropdown"
                  ref={register}
                >
                  <option selected={true} style={{ display: "none" }}>
                    Select a room...
                  </option>
                  {rooms?.map((room) => {
                    return (
                      <option key={room.title} value={room.title}>
                        {room.title}
                      </option>
                    );
                  })}
                </select>
                {errors.room && (
                  <span className="input-error">{errors.room.message}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="name">Name your event</label>
                <input
                  id="name"
                  name="name"
                  className="input-group__modal-input"
                  placeholder="Name"
                  ref={register}
                />
                {errors.name && (
                  <span className="input-error">{errors.name.message}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="description">Description</label>
                <textarea
                  name="description"
                  className="input-group__modal-input"
                  placeholder="Description"
                  ref={register}
                />
                {errors.description && (
                  <span className="input-error">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="host">Host (people hosting the event)</label>
                <input
                  id="host"
                  name="host"
                  className="input-group__modal-input"
                  placeholder="Dottie Longstockings"
                  ref={register}
                />
                {errors.host && (
                  <span className="input-error">{errors.host.message}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="date">Starting time</label>
                <label>
                  When does this event start? Use your local time zone, it will
                  be automatically converted for anyone visiting from around the
                  world.
                </label>
                <div className="input-group__flex">
                  <input
                    type="date"
                    min={dayjs().format("YYYY-MM-DD")}
                    name="start_date"
                    className="input-group__modal-input"
                    ref={register}
                  />
                  <input
                    type="time"
                    name="start_time"
                    className="input-group__modal-input"
                    ref={register}
                  />
                </div>

                <div className="input-group__flex">
                  {errors.start_date && (
                    <span className="input-error">
                      {errors.start_date.message}
                    </span>
                  )}
                  {errors.start_time && (
                    <span className="input-error">
                      {errors.start_time.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="duration_hours">Duration</label>
                <div className="input-group__flex">
                  <input
                    id="duration_hours"
                    name="duration_hours"
                    className="input-group__modal-input"
                    placeholder="hours"
                    ref={register}
                  />
                  <input
                    id="duration_minutes"
                    name="duration_minutes"
                    className="input-group__modal-input"
                    placeholder="minutes"
                    ref={register}
                  />
                </div>

                <div className="flex">
                  {errors.duration_hours && (
                    <span className="input-error">
                      {errors.duration_hours.message}
                    </span>
                  )}
                  {errors.duration_minutes && (
                    <span className="input-error">
                      {errors.duration_minutes.message}
                    </span>
                  )}
                </div>
              </div>

              <div style={event && { display: "flex" }}>
                <input
                  className="btn btn-primary btn-small {event && 'update-button'}"
                  type="submit"
                  value={event ? "Update" : "Create"}
                  disabled={formState.isSubmitting}
                />

                {template && HAS_ROOMS_TEMPLATES.includes(template) && event && (
                  <input
                    className="btn btn-primary btn-danger btn-small"
                    type="submit"
                    value="Delete"
                    onClick={(e) => {
                      e.preventDefault();
                      onHide();
                      setEditedEvent && setEditedEvent(event);
                      setShowDeleteEventModal();
                    }}
                    disabled={formState.isSubmitting}
                  />
                )}
              </div>
            </form>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};
