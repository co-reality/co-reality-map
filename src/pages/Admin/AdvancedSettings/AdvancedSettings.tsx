import React from "react";
import * as Yup from "yup";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { MAXIMUM_COLUMNS, MINIMUM_COLUMNS } from "settings";

import { updateVenue_v2 } from "api/admin";

import { Venue_v2_AdvancedConfig } from "types/venues";
import { UsernameVisibility } from "types/User";

import { useUser } from "hooks/useUser";

import { Checkbox } from "components/atoms/Checkbox";

import { AdvancedSettingsProps } from "./AdvancedSettings.types";

import * as S from "../Admin.styles";

// TODO: MOVE THIS TO A NEW FILE, DONT CLUTTER!
interface ToggleElementProps {
  title: string;
  name: string;
  forwardRef?: (
    value: React.RefObject<HTMLInputElement> | HTMLInputElement | null
  ) => void;
  isChecked?: boolean;
}
const ToggleElement: React.FC<ToggleElementProps> = ({
  title,
  name,
  forwardRef,
  isChecked,
  children,
}) => (
  <S.ItemWrapper>
    <S.ItemHeader>
      <S.TitleWrapper>
        <S.ItemTitle>{title}</S.ItemTitle>
      </S.TitleWrapper>
    </S.ItemHeader>

    <S.ItemBody>
      <Checkbox
        name={name}
        forwardedRef={forwardRef}
        defaultChecked={isChecked}
        toggler
      />

      {children}
    </S.ItemBody>
  </S.ItemWrapper>
);

const validationSchema = Yup.object().shape<Venue_v2_AdvancedConfig>({
  showGrid: Yup.boolean().notRequired(),
  columns: Yup.number().when("showGrid", {
    is: true,
    then: Yup.number()
      .required(
        `The columns need to be between ${MINIMUM_COLUMNS} and ${MAXIMUM_COLUMNS}.`
      )
      .min(MINIMUM_COLUMNS)
      .max(MAXIMUM_COLUMNS),
  }),
  radioStations: Yup.string().when("showRadio", {
    is: true,
    then: Yup.string().required("Radio stream is required!"),
  }),
  requiresDateOfBirth: Yup.bool().notRequired(),
  showBadges: Yup.bool().notRequired(),
  showNametags: Yup.mixed()
    .oneOf(Object.values(UsernameVisibility))
    .notRequired(),
  showRadio: Yup.bool().notRequired(),
  showRangers: Yup.bool().notRequired(),

  // TODO: Figure out how to validate with enum values
  // roomVisibility: Yup.string().notRequired()
});

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  venue,
  onSave,
}) => {
  const {
    watch,
    formState: { dirty, isSubmitting },
    register,
    errors,
    handleSubmit,
  } = useForm<Venue_v2_AdvancedConfig>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    validationSchema: validationSchema,
    defaultValues: {
      columns: venue.columns,
      radioStations: venue.radioStations ? venue.radioStations[0] : "",
      requiresDateOfBirth: venue.requiresDateOfBirth,
      showBadges: venue.showBadges,
      showNametags: venue.showNametags,
      showGrid: venue.showGrid,
      showRadio: venue.showRadio,
      showRangers: venue.showRangers,
      bannerMessage: venue.bannerMessage, // @deprecated + @debt probably need to change bannerMessage to banner
      attendeesTitle: venue.attendeesTitle,
      chatTitle: venue.chatTitle,
    },
  });

  const { user } = useUser();

  const values = watch();

  const onSubmit = (data: Venue_v2_AdvancedConfig) => {
    if (!user) return;

    updateVenue_v2(
      {
        name: venue.name,
        // @deprecated + @debt probably need to change bannerMessage to banner
        ...data,
      },
      user
    );

    onSave();
  };

  const renderShowGridToggle = () => (
    <ToggleElement
      forwardRef={register}
      isChecked={values.showGrid}
      name="showGrid"
      title="Show Grid"
    >
      <Form.Group>
        <Form.Label>Number of columns:</Form.Label>
        <Form.Control
          name="columns"
          type="number"
          placeholder="Enter number of grid columns"
          ref={register}
          custom
          disabled={!values.showGrid}
          min={1}
        />
        {errors.columns && (
          <span className="input-error">{errors.columns.message}</span>
        )}
      </Form.Group>
    </ToggleElement>
  );

  const renderRadioToggle = () => (
    <ToggleElement
      forwardRef={register}
      isChecked={values.showRadio}
      name="showRadio"
      title="Enable venue radio"
    >
      <Form.Group>
        <Form.Label>Radio station stream URL:</Form.Label>
        <Form.Control
          name="radioStations"
          ref={register}
          custom
          disabled={!values.showRadio}
        />
        {errors.radioStations && (
          <span className="input-error">{errors.radioStations.message}</span>
        )}
      </Form.Group>
    </ToggleElement>
  );

  const renderShowNametags = () => (
    <S.ItemWrapper>
      <S.ItemHeader>
        <S.TitleWrapper>
          <S.ItemTitle>Show Nametags</S.ItemTitle>
        </S.TitleWrapper>

        <S.ItemSubtitle>Display user names on their avatars</S.ItemSubtitle>
      </S.ItemHeader>

      <S.ItemBody>
        <Form.Control as="select" custom name="showNametags" ref={register}>
          <option value="none">None</option>
          {/* TODO: Implement Inline state */}
          {/* <option value="inline">Inline</option> */}
          <option value="hover">Inline and hover</option>
        </Form.Control>
      </S.ItemBody>
    </S.ItemWrapper>
  );

  const renderRoomVisibility = () => (
    <S.ItemWrapper>
      <S.ItemHeader>
        <S.TitleWrapper>
          <S.ItemTitle>Room appearance</S.ItemTitle>
        </S.TitleWrapper>

        <S.ItemSubtitle>
          Choose how you&apos;d like your rooms to appear on the map
        </S.ItemSubtitle>
      </S.ItemHeader>

      <S.ItemBody>
        <Form.Control as="select" custom name="roomVisibility" ref={register}>
          <option value="hover">Hover</option>
          <option value="count">Count</option>
          <option value="count/name">Count and names</option>
        </Form.Control>
      </S.ItemBody>
    </S.ItemWrapper>
  );

  const renderAnnouncementInput = () => (
    <S.ItemWrapper>
      <S.ItemHeader>
        <S.TitleWrapper>
          <S.ItemTitle>Venue announcement</S.ItemTitle>
        </S.TitleWrapper>
        <S.ItemSubtitle>
          Show an announcement in the venue (or leave blank for none)
        </S.ItemSubtitle>
      </S.ItemHeader>

      <S.ItemBody>
        <Form.Control
          name="bannerMessage"
          placeholder="Enter your announcement"
          ref={register}
          custom
          type="text"
        />
        {errors.bannerMessage && (
          <span className="input-error">{errors.bannerMessage.message}</span>
        )}
      </S.ItemBody>
    </S.ItemWrapper>
  );

  const renderAttendeesTitleInput = () => (
    <S.ItemWrapper>
      <S.ItemHeader>
        <S.TitleWrapper>
          <S.ItemTitle>Title of your venues attendees</S.ItemTitle>
        </S.TitleWrapper>
        <S.ItemSubtitle>
          For example: guests, attendees, partygoers.
        </S.ItemSubtitle>
      </S.ItemHeader>

      <S.ItemBody>
        <Form.Control
          name="attendeesTitle"
          placeholder="Attendees title"
          ref={register}
          custom
          type="text"
        />
        {errors.attendeesTitle && (
          <span className="input-error">{errors.attendeesTitle.message}</span>
        )}
      </S.ItemBody>
    </S.ItemWrapper>
  );

  const renderChatTitleInput = () => (
    <S.ItemWrapper>
      <S.ItemHeader>
        <S.TitleWrapper>
          <S.ItemTitle>Your venue chat label</S.ItemTitle>
        </S.TitleWrapper>
        <S.ItemSubtitle>For example: Party, Event, Meeting</S.ItemSubtitle>
      </S.ItemHeader>

      <S.ItemBody>
        <Form.Control
          name="chatTitle"
          placeholder="Event label"
          ref={register}
          custom
          type="text"
        />
        {errors.chatTitle && (
          <span className="input-error">{errors.chatTitle.message}</span>
        )}
      </S.ItemBody>
    </S.ItemWrapper>
  );

  return (
    <div>
      <h1>Advanced settings</h1>

      <Form onSubmit={handleSubmit(onSubmit)}>
        {renderAnnouncementInput()}
        {renderAttendeesTitleInput()}
        {renderChatTitleInput()}

        {renderShowGridToggle()}

        <ToggleElement
          forwardRef={register}
          isChecked={values.showBadges}
          name="showBadges"
          title="Show badges"
        />

        {renderShowNametags()}

        <ToggleElement
          forwardRef={register}
          isChecked={values.showRangers}
          name="showRangers"
          title="Show Rangers support"
        />

        <ToggleElement
          forwardRef={register}
          isChecked={values.requiresDateOfBirth}
          name="requiresDateOfBirth"
          title="Require date of birth on register"
        />

        {renderRadioToggle()}

        {renderRoomVisibility()}

        <Button type="submit" disabled={!dirty || isSubmitting}>
          Save
        </Button>
      </Form>
    </div>
  );
};

export default AdvancedSettings;
