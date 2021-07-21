import React from "react";
import { useForm } from "react-hook-form";
import { DropdownButton } from "react-bootstrap";
import DropdownItem from "react-bootstrap/DropdownItem";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

import { venueInsideUrl } from "utils/url";

import { InputField } from "components/atoms/InputField";
import { ButtonNG } from "components/atoms/ButtonNG/ButtonNG";

import "./RunTabToolbar.scss";
import { useConnectCurrentVenueNG } from "hooks/useConnectCurrentVenueNG";

export interface RunTabToolbarProps {
  venueId?: string;
}

const noop = () => undefined;

export const RunTabToolbar: React.FC<RunTabToolbarProps> = ({ venueId }) => {
  const { currentVenue } = useConnectCurrentVenueNG(venueId);
  const rooms = currentVenue?.rooms ?? [];

  const { register } = useForm<{
    message: string;
  }>({
    mode: "onSubmit",
  });
  return (
    <div className="RunTabToolbar__wrapper">
      <form
        className="RunTabToolbar__toolbar RunTabToolbar__toolbar--left RunTabToolbar__form"
        onSubmit={noop}
      >
        <DropdownButton
          id={"*"}
          title="Everyone"
          variant="secondary"
          className="RunTabToolbar__drop RunTabToolbar--spacing"
        >
          <DropdownItem active>Everyone</DropdownItem>
          {rooms.map((room, key) => (
            <DropdownItem key={key} active>
              {room.title}
            </DropdownItem>
          ))}
        </DropdownButton>
        <InputField
          containerClassName="RunTabToolbar__input RunTabToolbar__announce"
          inputClassName="mod--text-left"
          ref={register({ required: true })}
          name="message"
          placeholder="Announcement..."
          autoComplete="off"
        />
        <ButtonNG iconName={faPaperPlane} iconOnly={true} />
      </form>
      <div className="RunTabToolbar__toolbar RunTabToolbar__toolbar--right">
        <ButtonNG
          isLink={false}
          linkTo={venueId ? venueInsideUrl(venueId) : undefined}
          newTab={true}
          variant="primary"
          disabled={false}
        >
          Visit Space
        </ButtonNG>
      </div>
    </div>
  );
};
