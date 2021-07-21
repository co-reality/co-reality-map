import React, { useMemo } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useAsyncFn } from "react-use";

import { DEFAULT_VENUE_LOGO } from "settings";

import { createRoom, createVenue_v2 } from "api/admin";

import { venueInsideUrl } from "utils/url";
import { buildEmptyVenue } from "utils/venue";

import { RoomTemplate, VenueRoomTemplate } from "types/rooms";

import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";
import { useShowHide } from "hooks/useShowHide";

import {
  venueRoomSchema,
  roomSchema,
} from "pages/Admin/Details/ValidationSchema";

import { InputField } from "components/atoms/InputField";

import "./VenueRoomItem.scss";

export interface VenueRoomItemProps {
  icon: string;
  text: string;
  template?: VenueRoomTemplate;
}

export const VenueRoomItem: React.FC<VenueRoomItemProps> = ({
  icon,
  text,
  template,
}) => {
  const {
    isShown: isModalVisible,
    show: showModal,
    hide: hideModal,
  } = useShowHide();

  const { user } = useUser();

  const venueId = useVenueId();

  const isVenuePortal = template !== RoomTemplate.external;

  const { register, getValues, handleSubmit, errors } = useForm({
    validationSchema: isVenuePortal ? venueRoomSchema : roomSchema,
    defaultValues: {
      roomTitle: "",
      roomUrl: "",
      venueName: "",
      template: template,
    },
  });

  const [{ loading }, addRoom] = useAsyncFn(async () => {
    if (!user || !venueId || !template) return;

    const roomValues = getValues();

    const roomUrl = isVenuePortal
      ? window.origin + venueInsideUrl(roomValues.venueName)
      : roomValues.roomUrl;

    const roomData = {
      title: roomValues.roomTitle,
      isEnabled: true,
      image_url: DEFAULT_VENUE_LOGO,
      url: roomUrl,
      template,
    };

    // TS doesn't work properly with const statements and won't 'know' that this is already checked.
    // That's why this is inline instead of isVenuePortal
    if (template !== RoomTemplate.external) {
      const venueData = buildEmptyVenue(roomValues.venueName, template);

      await createVenue_v2(venueData, user);
    }

    await createRoom(roomData, venueId, user).then(() => hideModal());
  }, [getValues, hideModal, isVenuePortal, template, user, venueId]);

  const roomIconStyles = useMemo(() => ({ backgroundImage: `url(${icon})` }), [
    icon,
  ]);

  return (
    <>
      <Modal show={isModalVisible} onHide={hideModal}>
        <Modal.Body>
          <Form onSubmit={handleSubmit(addRoom)}>
            <Form.Label>Room title</Form.Label>
            <InputField
              name="roomTitle"
              type="text"
              autoComplete="off"
              placeholder="Room title"
              error={errors.roomTitle}
              ref={register()}
              disabled={loading}
            />

            {isVenuePortal && (
              <>
                <Form.Label>Venue name</Form.Label>
                <InputField
                  name="venueName"
                  type="text"
                  autoComplete="off"
                  placeholder="Venue name"
                  error={errors.venueName}
                  ref={register()}
                  disabled={loading}
                />
              </>
            )}

            {!isVenuePortal && (
              <>
                <Form.Label>Room url</Form.Label>
                <InputField
                  name="roomUrl"
                  type="text"
                  autoComplete="off"
                  placeholder="Room url"
                  error={errors.roomUrl}
                  ref={register()}
                  disabled={loading}
                />
              </>
            )}

            <Button disabled={loading} title="Add room" type="submit">
              Add room
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <div className="VenueRoomItem" onClick={showModal}>
        <div className="VenueRoomItem__room-icon" style={roomIconStyles} />
        <div>{text}</div>
      </div>
    </>
  );
};
