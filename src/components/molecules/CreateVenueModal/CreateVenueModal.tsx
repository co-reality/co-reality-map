import React, { useCallback } from "react";
import { Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useAsyncFn } from "react-use";
import Bugsnag from "@bugsnag/js";
import classNames from "classnames";

import { createVenue_v2, generateVenueLandingUrl } from "api/admin";

import { VenueTemplate } from "types/venues";

import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";

import { newVenueSchema } from "pages/Admin/Details/ValidationSchema";

import "./CreateVenueModal.scss";

export interface CreateVenueModalProps {
  isVisible: boolean;
  onHide?: () => void;
}

export interface FormValues {
  name: string;
}

export const CreateVenueModal: React.FC<CreateVenueModalProps> = ({
  isVisible,
  onHide,
}) => {
  const venueId = useVenueId();
  const { user } = useUser();

  const hide = useCallback(() => {
    onHide && onHide();
  }, [onHide]);

  const [{ loading: isLoading, error }, createVenue] = useAsyncFn(
    async (vals: FormValues) => {
      if (!user || isLoading) return;

      const venue = {
        name: vals.name,
        template: VenueTemplate.partymap,
      };

      await createVenue_v2(venue, user)
        .then(() => {
          hide();
        })
        .catch((e) => {
          Bugsnag.notify(e, (event) => {
            event.addMetadata("context", {
              location: "api::createVenueModal::createVenue_v2",
            });
          });
          throw new Error(e);
        });
    },
    [hide, user]
  );

  const { watch, register, errors, handleSubmit } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    validationSchema: newVenueSchema,
    validationContext: {
      editing: !!venueId,
    },
  });

  const values = watch();

  const venueUrl = generateVenueLandingUrl(values.name);

  return (
    <Modal
      show={isVisible}
      onHide={hide}
      centered
      backdropClassName="modal-backdrop in"
    >
      <Modal.Body className="CreateVenueModal modal-content in">
        <Form
          onSubmit={handleSubmit(createVenue)}
          className="CreateVenueModal__content"
        >
          <label className="CreateVenueModal__title">Name your new space</label>
          <Form.Control
            name="name"
            placeholder="Enter the name of your new space"
            ref={register}
            custom
            disabled={isLoading}
          />
          {errors.name && (
            <div className="input-error">{errors.name.message}</div>
          )}
          {error && (
            <div className="input-error">
              {error?.message ?? "An error occurred, please try again!"}
            </div>
          )}

          <div className="CreateVenueModal__url-info">
            The url of your party will be:{" "}
            <span className="CreateVenueModal__url">{venueUrl}</span>
          </div>

          <div className="CreateVenueModal__buttons">
            <button
              className={classNames("CreateVenueModal__buttons--back", {
                isLoading: "btn disabled",
              })}
              onClick={hide}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={classNames("CreateVenueModal__buttons--next", {
                isLoading: "btn disabled",
              })}
              type="submit"
              disabled={isLoading}
            >
              Next
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
