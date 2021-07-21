import React, { useCallback, useEffect } from "react";

// API
import {
  createUrlSafeName,
  createVenue_v2,
  VenueInput_v2,
  updateVenue_v2,
} from "api/admin";

// Components
import ImageInput from "components/atoms/ImageInput";

// Hooks
import { useHistory } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUser } from "hooks/useUser";

// Utils | Settings | Constants | Helpers
import { venueLandingUrl } from "utils/url";
import { createJazzbar } from "utils/venue";

// Typings
import { VenueTemplate } from "types/venues";
import { DetailsFormProps, FormValues } from "./DetailsForm.types";
import {
  setBannerURL,
  setSquareLogoUrl,
} from "pages/Admin/Venue/VenueWizard/redux/actions";

// Validation schemas
import { validationSchema_v2 } from "../ValidationSchema";

// Reducer
import { SET_FORM_VALUES } from "pages/Admin/Venue/VenueWizard/redux/actionTypes";

// Stylings
import * as S from "./DetailsForm.styles";
import { Button, Form } from "react-bootstrap";
import { useVenueId } from "hooks/useVenueId";

const DetailsForm: React.FC<DetailsFormProps> = ({ dispatch, editData }) => {
  const history = useHistory();
  const venueId = useVenueId();
  const { user } = useUser();

  const onSubmit = useCallback(
    async (vals: FormValues) => {
      if (!user) return;

      try {
        // unfortunately the typing is off for react-hook-forms.
        if (!!venueId) await updateVenue_v2(vals as VenueInput_v2, user);
        else await createVenue_v2(vals as VenueInput_v2, user);

        if (vals.name) {
          history.push(`/admin-ng/venue/${createUrlSafeName(vals.name)}`);
        } else {
          history.push("/admin-ng");
        }
      } catch (e) {
        console.error(e);
      }
    },
    [user, venueId, history]
  );

  const {
    watch,
    formState: { isSubmitting, dirty },
    register,
    setValue,
    errors,
    handleSubmit,
  } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    validationSchema: validationSchema_v2,
    validationContext: {
      editing: !!venueId,
    },
  });

  const values = watch();

  const urlSafeName = values.name
    ? `${window.location.host}${venueLandingUrl(
        createUrlSafeName(values.name)
      )}`
    : undefined;
  const disable = isSubmitting;

  // @debt Should this be hardcoded here like this? At the very least maybe it should reference a constant/be defined outside of this component render
  const templateID = VenueTemplate.partymap;
  const nameDisabled = isSubmitting || !!venueId;

  const defaultVenue = createJazzbar({});

  useEffect(() => {
    if (editData && venueId) {
      setValue([
        { name: editData?.name },
        { subtitle: editData?.subtitle },
        { description: editData?.description },
        { bannerImageUrl: editData?.bannerImageUrl },
        { logoImageUrl: editData?.logoImageUrl },
        { showGrid: editData?.showGrid },
      ]);
    }
  }, [editData, setValue, values.columns, venueId]);

  const handleBannerUpload = (url: string) => setBannerURL(dispatch, url);

  const handleLogoUpload = (url: string) => setSquareLogoUrl(dispatch, url);

  const renderVenueName = () => (
    <S.InputContainer hasError={!!errors?.name}>
      <h4 className="italic" style={{ fontSize: "20px" }}>
        Name your party
      </h4>
      <input
        disabled={disable || !!venueId}
        name="name"
        ref={register}
        className="align-left"
        placeholder="My Party Name"
        style={{ cursor: nameDisabled ? "disabled" : "text" }}
      />
      {errors.name ? (
        <span className="input-error">{errors.name.message}</span>
      ) : urlSafeName ? (
        <S.InputInfo>
          The URL of your party will be: <b>{urlSafeName}</b>
        </S.InputInfo>
      ) : null}
    </S.InputContainer>
  );

  const renderSubtitle = () => (
    <S.InputContainer hasError={!!errors?.subtitle}>
      <h4 className="italic" style={{ fontSize: "20px" }}>
        Party subtitle
      </h4>
      <input
        disabled={disable}
        name={"subtitle"}
        ref={register}
        className="wide-input-block align-left"
        placeholder={defaultVenue.config?.landingPageConfig.subtitle}
      />
      {errors.subtitle && (
        <span className="input-error">{errors.subtitle.message}</span>
      )}
    </S.InputContainer>
  );

  const renderDescription = () => (
    <S.InputContainer hasError={!!errors?.description}>
      <h4 className="italic" style={{ fontSize: "20px" }}>
        Party description
      </h4>
      <textarea
        disabled={disable}
        name={"description"}
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder={defaultVenue.config?.landingPageConfig.description}
      />
      {errors.description && (
        <span className="input-error">{errors.description.message}</span>
      )}
    </S.InputContainer>
  );

  const renderBannerUpload = () => (
    <S.InputContainer>
      <h4 className="italic" style={{ fontSize: "20px" }}>
        Upload a banner photo
      </h4>
      <ImageInput
        onChange={handleBannerUpload}
        name="bannerImage"
        error={errors.bannerImageFile || errors.bannerImageUrl}
        forwardRef={register}
        imgUrl={editData?.bannerImageUrl}
      />
    </S.InputContainer>
  );

  const renderLogoUpload = () => (
    <S.InputContainer>
      <h4 className="italic" style={{ fontSize: "20px" }}>
        Upload your logo
      </h4>
      <ImageInput
        onChange={handleLogoUpload}
        name="logoImage"
        small
        error={errors.logoImageFile || errors.logoImageUrl}
        forwardRef={register}
        imgUrl={editData?.logoImageUrl}
      />
    </S.InputContainer>
  );

  const handleOnChange = () => {
    return dispatch({
      type: SET_FORM_VALUES,
      payload: {
        name: values.name,
        subtitle: values.subtitle,
        description: values.description,
      },
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} onChange={handleOnChange}>
      <S.FormInnerWrapper>
        <input
          type="hidden"
          name="template"
          value={templateID}
          ref={register}
        />
        <h4 className="italic" style={{ fontSize: "30px" }}>
          {venueId ? "Edit your party" : "Create your party"}
        </h4>
        <p
          className="small light"
          style={{ marginBottom: "2rem", fontSize: "16px" }}
        >
          You can change anything except for the name of your venue later
        </p>

        {renderVenueName()}
        {renderSubtitle()}
        {renderDescription()}
        {renderBannerUpload()}
        {renderLogoUpload()}
      </S.FormInnerWrapper>

      <S.FormFooter>
        <Button disabled={isSubmitting || !dirty} type="submit">
          {!!venueId ? "Update Venue" : "Create Venue"}
        </Button>
      </S.FormFooter>
    </Form>
  );
};

export default DetailsForm;
