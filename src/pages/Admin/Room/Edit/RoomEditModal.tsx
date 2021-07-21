import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Form, Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { CustomInputsType, RoomTemplate, ROOM_TEMPLATES } from "settings";

import { RoomData_v2 } from "types/rooms";

import { roomEditSchema } from "pages/Admin/Details/ValidationSchema";
import ImageInput from "components/atoms/ImageInput";

import "./RoomEditModal.scss";

interface RoomEditModalProps {
  isVisible: boolean;
  onClickOutsideHandler: () => void;
  room: RoomData_v2;
  submitHandler: (values: RoomData_v2, index: number) => void;
  deleteHandler: () => void;
}

export const RoomEditModal: React.FC<RoomEditModalProps> = ({
  isVisible,
  onClickOutsideHandler,
  room,
  submitHandler,
  deleteHandler,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    room.template
  );

  const [roomTemplate, setRoomTemplate] = useState<RoomTemplate | undefined>(
    undefined
  );

  useEffect(() => {
    const template = ROOM_TEMPLATES.find(
      (roomTemplate) => roomTemplate.template === selectedTemplate
    );
    setRoomTemplate(template);
  }, [selectedTemplate]);

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    errors,
    formState: { isSubmitting, dirty },
  } = useForm({
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

  const onSubmit = useCallback(() => {
    if (room.roomIndex === undefined) return;

    const roomValues: RoomData_v2 = {
      ...room,
      ...values,
    };

    return submitHandler(roomValues, room.roomIndex);
  }, [room, submitHandler, values]);

  const customInputFields = useMemo(
    () =>
      roomTemplate?.customInputs?.map((input: CustomInputsType) => (
        <div className="room-edit-modal__input" key={input.name}>
          <span>{input.title}</span>
          <input type="text" name={input.name} ref={register} />
        </div>
      )),
    [register, roomTemplate]
  );

  return (
    <Modal
      show={isVisible}
      onHide={onClickOutsideHandler}
      className="room-edit-modal"
    >
      <Modal.Header>
        <Modal.Title>Editing - {room.title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Row>
            <div className="room-edit-modal__input">
              <Form.Label>Name your room</Form.Label>
              <Form.Control
                type="text"
                ref={register}
                name="title"
                placeholder="Room name"
                custom
              />
              {errors.title && (
                <span className="input-error">{errors.title.message}</span>
              )}
            </div>
          </Form.Row>

          <Form.Row>
            <div className="room-edit-modal__input">
              <Form.Label>The room url</Form.Label>
              <Form.Control
                type="text"
                ref={register}
                name="url"
                placeholder="Room url"
                custom
              />
              {errors.url && (
                <span className="input-error">{errors.url.message}</span>
              )}
            </div>
          </Form.Row>

          <Form.Row>
            <div className="room-edit-modal__input">
              <Form.Label>The room description (optional)</Form.Label>
              <Form.Control
                type="text"
                ref={register}
                name="description"
                placeholder="Description"
                custom
              />
              {errors.description && (
                <span className="input-error">
                  {errors.description.message}
                </span>
              )}
            </div>
          </Form.Row>

          <Form.Row>
            <div className="room-edit-modal__input">
              <Form.Label>
                How you want the room to appear on the map
              </Form.Label>
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
            </div>
          </Form.Row>

          {customInputFields}

          <Form.Row>
            <div className="room-edit-modal__input">
              <Form.Label>Change room template</Form.Label>
              <Form.Control
                as="select"
                custom
                name="template"
                ref={register}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedTemplate(e.target.value)
                }
              >
                {ROOM_TEMPLATES.map((template) => (
                  <option key={template.name}>{template.template}</option>
                ))}
              </Form.Control>
            </div>
          </Form.Row>

          <div className="room-edit-modal__buttons">
            <Button variant="danger" onClick={deleteHandler}>
              Delete room
            </Button>

            <Button type="submit" disabled={isSubmitting || !dirty}>
              Save room
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
