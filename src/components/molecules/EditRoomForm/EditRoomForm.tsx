import React, { useCallback, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useAsyncFn } from "react-use";

import { deleteRoom, RoomInput, upsertRoom } from "api/admin";

import { RoomData_v2 } from "types/rooms";

import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";

import { roomEditSchema } from "pages/Admin/Details/ValidationSchema";

import ImageInput from "components/atoms/ImageInput";
import { InputField } from "components/atoms/InputField";

import "./EditRoomForm.scss";

interface EditRoomFormProps {
  room: RoomData_v2;
  updatedRoom: RoomData_v2;
  roomIndex: number;
  onBackClick: (roomIndex: number) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}
export const EditRoomForm: React.FC<EditRoomFormProps> = ({
  room,
  updatedRoom,
  roomIndex,
  onBackClick,
  onDelete,
  onEdit,
}) => {
  const [error, setError] = useState<string>("");

  const { user } = useUser();

  const venueId = useVenueId();

  const { register, handleSubmit, setValue, watch, errors } = useForm({
    reValidateMode: "onChange",
    validationSchema: roomEditSchema,
    defaultValues: {
      title: room.title,
      url: room.url,
      description: room.description,
      template: room.template,
      image_url: room.image_url,
    },
  });

  const values = watch();

  const handleImageChange = useCallback(
    (val: string) => {
      setValue("image_url", val, false);
    },
    [setValue]
  );

  const [{ loading: isUpdating }, updateSelectedRoom] = useAsyncFn(async () => {
    if (!user || !venueId) return;
    const roomData = {
      ...(room as RoomInput),
      ...(updatedRoom as RoomInput),
      ...values,
    };

    await upsertRoom(roomData, venueId, user, roomIndex);
    onEdit && onEdit();
  }, [onEdit, room, roomIndex, updatedRoom, user, values, venueId]);

  const [{ loading: isDeleting }, deleteSelectedRoom] = useAsyncFn(async () => {
    if (!venueId) return;

    try {
      await deleteRoom(venueId, room);
      onDelete && onDelete();
    } catch (error) {
      setError("Can't delete room, please try again.");
    }
  }, [venueId, room, onDelete]);

  const handleBackClick = useCallback(
    (roomIndex: number) => {
      onBackClick(roomIndex);
    },
    [onBackClick]
  );

  return (
    <Form onSubmit={handleSubmit(updateSelectedRoom)}>
      <div className="EditSpace">
        <div className="EditSpace__room">
          <Form.Label>Room type</Form.Label>
          <InputField
            name="template"
            type="text"
            autoComplete="off"
            placeholder="Room template"
            error={errors.template}
            defaultValue={room.template}
            ref={register()}
            disabled={true}
          />

          <Form.Label>Room name</Form.Label>
          <InputField
            name="title"
            type="text"
            autoComplete="off"
            placeholder="Room name"
            error={errors.title}
            defaultValue={room.title}
            ref={register()}
          />

          <Form.Label>Room tagline</Form.Label>
          <InputField
            name="description"
            type="text"
            autoComplete="off"
            placeholder="Description"
            error={errors.description}
            defaultValue={room.description}
            ref={register()}
          />

          <Form.Label>Room url</Form.Label>
          <InputField
            name="url"
            type="text"
            autoComplete="off"
            placeholder="Room url"
            error={errors.url}
            defaultValue={room.url}
            ref={register()}
          />

          <Form.Label>Room image:</Form.Label>
          <ImageInput
            onChange={handleImageChange}
            name="image"
            forwardRef={register}
            small
            nameWithUnderscore
            imgUrl={room.image_url}
          />
          {errors.image_url && (
            <span className="input-error">{errors.image_url.message}</span>
          )}

          <Button
            disabled={isUpdating || isDeleting}
            onClick={deleteSelectedRoom}
          >
            Delete room
          </Button>
          {error && <div>Error: {error}</div>}
        </div>

        <div className="EditSpace__footer">
          <Button onClick={() => handleBackClick(roomIndex)}>Back</Button>
          <Button
            className="confirm-button"
            type="submit"
            disabled={isUpdating || isDeleting}
          >
            Save changes
          </Button>
        </div>
      </div>
    </Form>
  );
};
