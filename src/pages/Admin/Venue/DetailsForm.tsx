import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from "react";
import { ErrorMessage, FieldErrors, useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { Form } from "react-bootstrap";
import Bugsnag from "@bugsnag/js";
import "firebase/functions";
import * as Yup from "yup";

import {
  createUrlSafeName,
  createVenue,
  updateVenue,
  VenueInput,
} from "api/admin";

import { setSovereignVenue } from "store/actions/SovereignVenue";

import {
  ZOOM_URL_TEMPLATES,
  IFRAME_TEMPLATES,
  PLAYA_IMAGE,
  PLAYA_VENUE_SIZE,
  PLAYA_VENUE_STYLES,
  PLAYA_VENUE_NAME,
  HAS_ROOMS_TEMPLATES,
  BANNER_MESSAGE_TEMPLATES,
  PLAYA_WIDTH,
  PLAYA_HEIGHT,
  HAS_GRID_TEMPLATES,
  HAS_REACTIONS_TEMPLATES,
  BACKGROUND_IMG_TEMPLATES,
  DEFAULT_SHOW_SCHEDULE,
  DEFAULT_USER_STATUS,
  DEFAULT_SHOW_USER_STATUSES,
  DEFAULT_AUDIENCE_COLUMNS_NUMBER,
  DEFAULT_AUDIENCE_ROWS_NUMBER,
} from "settings";

import { IS_BURN } from "secrets";

import { AnyVenue, VenuePlacementState, VenueTemplate } from "types/venues";
import { ExtractProps } from "types/utility";
import { UserStatus } from "types/User";

import { isTruthy } from "utils/types";
import { venueLandingUrl } from "utils/url";
import { createJazzbar } from "utils/venue";

import { useUser } from "hooks/useUser";
import { useSovereignVenue } from "hooks/useSovereignVenue";
import { useShowHide } from "hooks/useShowHide";
import { useQuery } from "hooks/useQuery";
import { useDispatch } from "hooks/useDispatch";

import { ImageInput } from "components/molecules/ImageInput";
import { ImageCollectionInput } from "components/molecules/ImageInput/ImageCollectionInput";
import { UserStatusManager } from "components/molecules/UserStatusManager";

import { Toggler } from "components/atoms/Toggler";

import { PlayaContainer } from "pages/Account/Venue/VenueMapEdition";

import {
  editVenueCastSchema,
  validationSchema,
} from "./DetailsValidationSchema";
import { WizardPage } from "./VenueWizard";
import QuestionInput from "./QuestionInput";
import EntranceInput from "./EntranceInput";

// @debt refactor any needed styles out of this file (eg. toggles, etc) and into DetailsForm.scss/similar, then remove this import
import "../Admin.scss";

import "./Venue.scss";

export type FormValues = Partial<Yup.InferType<typeof validationSchema>>; // bad typing. If not partial, react-hook-forms should force defaultValues to conform to FormInputs but it doesn't

interface DetailsFormProps extends WizardPage {
  venueId?: string;
}

const iconPositionFieldName = "iconPosition";

// @debt Refactor this constant into settings, or types/templates, or similar?
// @debt remove reference to legacy 'Theme Camp' here, both should probably just
//  display the same text as themecamp is now essentially just an alias of partymap
const backgroundTextByVenue: Record<string, string> = {
  [VenueTemplate.themecamp]: "Theme Camp",
  [VenueTemplate.partymap]: "Party Map",
};

export const DetailsForm: React.FC<DetailsFormProps> = ({
  previous,
  state,
  venueId,
}) => {
  const defaultValues = useMemo(
    () =>
      !!venueId
        ? editVenueCastSchema.cast(state.detailsPage?.venue)
        : validationSchema.cast(),
    [state.detailsPage, venueId]
  );

  const queryParams = useQuery();
  const parentIdQuery = queryParams.get("parentId");

  const dispatch = useDispatch();
  const { sovereignVenueId, sovereignVenue } = useSovereignVenue({ venueId });

  const {
    watch,
    formState,
    register,
    setValue,
    control,
    handleSubmit,
    errors,
    setError,
  } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    validationSchema: validationSchema,
    validationContext: {
      template: state.templatePage?.template,
      editing: !!venueId,
    },
    defaultValues: {
      ...defaultValues,
      parentId: parentIdQuery ?? defaultValues?.parentId ?? "",
    },
  });
  const { user } = useUser();
  const history = useHistory();
  const { isSubmitting } = formState;
  const values = watch();

  const [formError, setFormError] = useState(false);

  //register the icon position data
  useEffect(() => {
    register("placement");
  }, [register]);

  const placementDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientWidth = placementDivRef.current?.clientWidth ?? 0;
    const clientHeight = placementDivRef.current?.clientHeight ?? 0;

    placementDivRef.current?.scrollTo(
      (state?.detailsPage?.venue.placement?.x ?? 0) - clientWidth / 2,
      (state?.detailsPage?.venue.placement?.y ?? 0) - clientHeight / 2
    );
  }, [state]);

  // @debt refactor this to split it into more manageable chunks, most likely with some things pulled into the api/* layer
  // @debt refactor this to use useAsync or useAsyncFn as appropriate
  const onSubmit = useCallback(
    async (
      vals: Partial<FormValues>,
      userStatuses: UserStatus[],
      showUserStatuses: boolean
    ) => {
      if (!user || formError) return;
      try {
        // unfortunately the typing is off for react-hook-forms.
        if (venueId) {
          await updateVenue(
            {
              ...(vals as VenueInput),
              id: venueId,
              userStatuses,
              showUserStatus: showUserStatuses,
            },
            user
          );

          //@debt Create separate function that updates the userStatuses separately by venue id.
          if (
            sovereignVenueId &&
            sovereignVenue &&
            sovereignVenueId !== venueId
          )
            await updateVenue(
              {
                id: sovereignVenueId,
                name: sovereignVenue.name,
                subtitle:
                  sovereignVenue.config?.landingPageConfig.subtitle ?? "",
                description:
                  sovereignVenue.config?.landingPageConfig.description ?? "",
                adultContent: sovereignVenue.adultContent ?? false,
                profile_questions: sovereignVenue.profile_questions,
                code_of_conduct_questions:
                  sovereignVenue.code_of_conduct_questions,
                userStatuses,
                showUserStatus: showUserStatuses,
                template: sovereignVenue.template,
              },
              user
            ).then(() => {
              if (sovereignVenue) {
                dispatch(
                  setSovereignVenue({
                    ...sovereignVenue,
                    userStatuses,
                    showUserStatus: showUserStatuses,
                  })
                );
              }
            });
        } else
          await createVenue(
            {
              ...vals,
              userStatuses,
              showUserStatus: showUserStatuses,
            } as VenueInput,
            user
          );

        vals.name
          ? history.push(`/admin/${createUrlSafeName(venueId ?? vals.name)}`)
          : history.push(`/admin`);
      } catch (e) {
        setFormError(true);
        Bugsnag.notify(e, (event) => {
          event.addMetadata("Admin::Venue::DetailsForm::onSubmit", {
            venueId,
            vals,
          });
        });
      }
    },
    [
      user,
      formError,
      venueId,
      history,
      sovereignVenueId,
      sovereignVenue,
      dispatch,
    ]
  );

  const mapIconUrl = useMemo(() => {
    const file = values.mapIconImageFile;
    if (file && file.length > 0) return URL.createObjectURL(file[0]);
    return values.mapIconImageUrl;
  }, [values.mapIconImageFile, values.mapIconImageUrl]);

  const iconsMap = useMemo(
    () =>
      mapIconUrl
        ? {
            [iconPositionFieldName]: {
              width: PLAYA_VENUE_SIZE,
              height: PLAYA_VENUE_SIZE,
              top: defaultValues?.placement?.y ?? 0,
              left: defaultValues?.placement?.x ?? 0,
              url: mapIconUrl,
            },
          }
        : undefined,
    [mapIconUrl, defaultValues]
  );

  const onBoxMove: ExtractProps<
    typeof PlayaContainer
  >["onChange"] = useCallback(
    (val) => {
      if (!(iconPositionFieldName in val)) return;
      const iconPos = val[iconPositionFieldName];
      setValue("placement", {
        x: iconPos.left,
        y: iconPos.top,
      });
    },
    [setValue]
  );

  useEffect(() => {
    if (!previous || isTruthy(state.templatePage)) return;

    previous();
  }, [previous, state.templatePage]);

  if (!state.templatePage) {
    // In reality users should never actually see this, since the useEffect above should navigate us back to ?page=1
    return <>Error: state.templatePage not defined.</>;
  }

  const isAdminPlaced =
    state.detailsPage?.venue?.placement?.state ===
    VenuePlacementState.AdminPlaced;
  const placementAddress = state.detailsPage?.venue?.placement?.addressText;

  // @debt refactor any needed styles out of Admin.scss (eg. toggles, etc) and into DetailsForm.scss/similar, then remove the admin-dashboard class from this container
  return (
    <div className="page page--admin admin-dashboard">
      <div className="page-side page-side--admin">
        <div className="page-container-left page-container-left">
          <div className="page-container-left-content">
            <DetailsFormLeft
              venueId={venueId}
              setValue={setValue}
              state={state}
              previous={previous}
              values={values}
              sovereignVenue={sovereignVenue}
              isSubmitting={isSubmitting}
              register={register}
              watch={watch}
              onSubmit={onSubmit}
              editing={!!venueId}
              formError={formError}
              setFormError={setFormError}
              control={control}
              handleSubmit={handleSubmit}
              errors={errors}
              setError={setError}
            />
          </div>
        </div>
      </div>
      {IS_BURN && (
        <div className="page-side preview" style={{ paddingBottom: "20px" }}>
          <h4
            className="italic"
            style={{ textAlign: "center", fontSize: "22px" }}
          >
            Position your venue on the {PLAYA_VENUE_NAME}
          </h4>
          {isAdminPlaced ? (
            <p className="warning">
              Your venue has been placed by our placement team and cannot be
              moved.{" "}
              {placementAddress && (
                <>
                  The placement team wrote your address as: {placementAddress}
                </>
              )}
            </p>
          ) : (
            <p>
              First upload or select the icon you would like to appear on the
              {PLAYA_VENUE_NAME}, then drag it around to position it. The
              placement team from SparkleVerse will place your camp later, after
              which you will need to reach out if you want it moved.
            </p>
          )}
          <div
            className="playa"
            ref={placementDivRef}
            style={{ width: "100%", height: 1000, overflow: "scroll" }}
          >
            <PlayaContainer
              rounded
              interactive={!isAdminPlaced}
              resizable={false}
              coordinatesBoundary={{
                width: PLAYA_WIDTH,
                height: PLAYA_HEIGHT,
              }}
              onChange={onBoxMove}
              snapToGrid={false}
              iconsMap={iconsMap ?? {}}
              backgroundImage={PLAYA_IMAGE}
              iconImageStyle={PLAYA_VENUE_STYLES.iconImage}
              draggableIconImageStyle={PLAYA_VENUE_STYLES.draggableIconImage}
              venueId={venueId}
              otherIconsStyle={{ opacity: 0.4 }}
              containerStyle={{
                width: PLAYA_WIDTH,
                height: PLAYA_HEIGHT,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface DetailsFormLeftProps {
  venueId?: string;
  sovereignVenue?: AnyVenue;
  state: WizardPage["state"];
  previous: WizardPage["previous"];
  values: FormValues;
  isSubmitting: boolean;
  register: ReturnType<typeof useForm>["register"];
  watch: ReturnType<typeof useForm>["watch"];
  control: ReturnType<typeof useForm>["control"];
  onSubmit: (
    vals: Partial<FormValues>,
    userStatuses: UserStatus[],
    showUserStatuses: boolean
  ) => Promise<void>;
  handleSubmit: ReturnType<typeof useForm>["handleSubmit"];
  errors: FieldErrors<FormValues>;
  setError: ReturnType<typeof useForm>["setError"];
  editing?: boolean;
  setValue: ReturnType<typeof useForm>["setValue"];
  formError: boolean;
  setFormError: (value: boolean) => void;
}

const DetailsFormLeft: React.FC<DetailsFormLeftProps> = ({
  venueId,
  sovereignVenue,
  editing,
  state,
  values,
  isSubmitting,
  register,
  watch,
  errors,
  setError,
  previous,
  onSubmit,
  handleSubmit,
  setValue,
  formError,
  setFormError,
}) => {
  const urlSafeName = values.name
    ? `${window.location.host}${venueLandingUrl(
        createUrlSafeName(values.name)
      )}`
    : undefined;
  const disable = isSubmitting;
  const templateType = state.templatePage?.template.name;
  const templateID = state.templatePage?.template.template;

  const defaultVenue = createJazzbar({});

  const renderVenueNameInput = () => {
    return !editing ? (
      <div className="input-container">
        <h4 className="italic input-header">Name your {templateType}</h4>
        <input
          disabled={disable}
          name="name"
          ref={register}
          className="align-left"
          placeholder={`My ${templateType} name`}
        />
        {errors.name ? (
          <span className="input-error">{errors.name.message}</span>
        ) : urlSafeName ? (
          <span className="input-info">
            The URL of your venue will be: <b>{urlSafeName}</b>
          </span>
        ) : null}
      </div>
    ) : (
      <div className="input-container">
        <h4 className="italic input-header">
          Your {templateType}: {values.name}
        </h4>
        <input type="hidden" name="name" ref={register} value={values.name} />
        <span className="input-info">
          The URL of your venue will be: <b>{urlSafeName}</b>
        </span>
      </div>
    );
  };

  const renderTaglineInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">The venue tagline</h4>
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
    </div>
  );

  const renderDescriptionInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Long description</h4>
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
    </div>
  );

  const renderRestrictToAdultsInput = () => (
    <div className="input-container">
      <label
        htmlFor={"chkadultContent"}
        className={`checkbox ${
          watch("adultContent", false) && "checkbox-checked"
        }`}
      >
        Restrict entry to adults aged 18+
      </label>
      <input
        type="checkbox"
        id={"chkadultContent"}
        name={"adultContent"}
        defaultChecked={values.adultContent}
        ref={register}
      />
    </div>
  );

  const renderBannerPhotoInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Upload a banner photo</h4>
      <ImageInput
        disabled={disable}
        name={"bannerImageFile"}
        image={values.bannerImageFile}
        remoteUrlInputName={"bannerImageUrl"}
        remoteImageUrl={values.bannerImageUrl}
        ref={register}
        error={errors.bannerImageFile || errors.bannerImageUrl}
      />
    </div>
  );

  const renderLogoInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Upload a square logo</h4>
      <ImageInput
        disabled={disable}
        ref={register}
        image={values.logoImageFile}
        remoteUrlInputName={"logoImageUrl"}
        remoteImageUrl={values.logoImageUrl}
        name={"logoImageFile"}
        containerClassName="input-square-container"
        imageClassName="input-square-image"
        error={errors.logoImageFile || errors.logoImageUrl}
      />
    </div>
  );

  const renderAnnouncementInput = () => (
    <>
      <h4 className="italic input-header">
        Show an announcement in the venue (or leave blank for none)
      </h4>
      <input
        type="text"
        disabled={disable}
        name="bannerMessage"
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="Enter your announcement"
      />
      {errors.bannerMessage && (
        <span className="input-error">{errors.bannerMessage.message}</span>
      )}
    </>
  );

  const renderAttendeesTitleInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Title of your venues attendees</h4>
      <div style={{ fontSize: "16px" }}>
        For example: guests, attendees, partygoers.
      </div>
      <input
        type="text"
        disabled={disable}
        name="attendeesTitle"
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="Attendees title"
      />
      {errors.attendeesTitle && (
        <span className="input-error">{errors.attendeesTitle.message}</span>
      )}
    </div>
  );

  const renderChatTitleInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Your venue type label</h4>
      <div style={{ fontSize: "16px" }}>For example: Party, Event, Meeting</div>
      <input
        type="text"
        disabled={disable}
        name="chatTitle"
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="Event label"
      />
      {errors.chatTitle && (
        <span className="input-error">{errors.chatTitle.message}</span>
      )}
    </div>
  );

  const renderUrlInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">URL</h4>
      <div style={{ fontSize: "16px" }}>
        Please post a URL to, for example, a Zoom room, Twitch stream, other
        Universe, or any interesting thing out there on the open web.
      </div>
      <textarea
        disabled={disable}
        name={"zoomUrl"}
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="https://us02web.zoom.us/j/654123654123"
      />
      {errors.zoomUrl && (
        <span className="input-error">{errors.zoomUrl.message}</span>
      )}
    </div>
  );

  const renderLivestreamUrlInput = () => (
    <div className="input-container">
      <div className="input-title">
        Livestream URL, or embed URL, for people to view in your venue
      </div>
      <div className="input-title">
        (Enter an embeddable URL link. You can edit this later so you can leave
        a placeholder for now)
      </div>
      <textarea
        disabled={disable}
        name={"iframeUrl"}
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="https://youtu.be/embed/abcDEF987w"
      />
      {errors.iframeUrl && (
        <span className="input-error">{errors.iframeUrl.message}</span>
      )}
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowScheduleToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show Schedule</h4>
      <Toggler
        name="showSchedule"
        forwardedRef={register}
        defaultToggled={DEFAULT_SHOW_SCHEDULE}
      />
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowGridToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show grid layout</h4>
      <Toggler name="showGrid" forwardedRef={register} />
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowBadgesToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show badges</h4>
      <Toggler name="showBadges" forwardedRef={register} />
    </div>
  );

  const renderSeatingNumberInput = () => (
    <>
      <div className="input-container">
        <h4 className="italic input-header">Number of seats columns</h4>
        <input
          disabled={disable}
          defaultValue={DEFAULT_AUDIENCE_COLUMNS_NUMBER}
          min={5}
          name="auditoriumColumns"
          type="number"
          ref={register}
          className="align-left"
          placeholder="Number of seats columns"
        />
        {errors.auditoriumColumns ? (
          <span className="input-error">
            {errors.auditoriumColumns.message}
          </span>
        ) : null}
      </div>
      <div className="input-container">
        <h4 className="italic input-header">Number of seats rows</h4>
        <input
          disabled={disable}
          defaultValue={DEFAULT_AUDIENCE_ROWS_NUMBER}
          name="auditoriumRows"
          type="number"
          ref={register}
          className="align-left"
          placeholder="Number of seats rows"
          min={5}
        />
        {errors.auditoriumRows ? (
          <span className="input-error">{errors.auditoriumRows.message}</span>
        ) : null}
      </div>
    </>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowReactions = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show reactions</h4>
      <Toggler name="showReactions" forwardedRef={register} />
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowShoutouts = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show shoutouts</h4>
      <Toggler name="showShoutouts" forwardedRef={register} />
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderShowRangersToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Show Rangers support</h4>
      <Toggler name="showRangers" forwardedRef={register} />
    </div>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderRestrictDOBToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Require date of birth on register</h4>
      <Toggler name="requiresDateOfBirth" forwardedRef={register} />
    </div>
  );

  const renderGridDimensionsInputs = () => (
    <>
      <div className="input-container">
        <h4 className="italic input-header">Number of columns</h4>
        <input
          disabled={disable}
          defaultValue={1}
          name="columns"
          type="number"
          ref={register}
          className="align-left"
          placeholder={`Number of grid columns`}
        />
        {errors.columns ? (
          <span className="input-error">{errors.columns.message}</span>
        ) : null}
      </div>
      <div className="input-container">
        <h4 className="italic input-header">Number of rows</h4>
        <div>
          Not editable. The number of rows is derived from the number of
          specified columns and the width:height ratio of the party map, to keep
          the two aligned.
        </div>
      </div>
    </>
  );

  const renderParentIdInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">
        Enter the parent venue ID, for the &quot;back&quot; button to go to, and
        for sharing events in the schedule
      </h4>
      <div style={{ fontSize: "16px" }}>
        The nav bar can show a &quot;back&quot; button if you enter an ID here.
        Clicking &quot;back&quot; will return the user to the venue whose ID you
        enter. Additionally, the events you add here will be shown to users
        while they are on all other venues which share the parent venue ID you
        enter here, as well as in the parent venue. The value is a venue ID.
        Enter the venue ID you wish to use. A venue ID is the part of the URL
        after /in/, so eg. for <i>sparkle.space/in/abcdef</i> you would enter{" "}
        <i>abcdef</i>
        below
      </div>
      <input
        type="text"
        disabled={disable}
        name="parentId"
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="abcdef"
      />
      {errors.parentId && (
        <span className="input-error">{errors.parentId.message}</span>
      )}
    </div>
  );

  const renderRoomAppearanceSelect = () => (
    <>
      <h4 className="italic input-header">
        Choose how you&apos;d like your rooms to appear on the map
      </h4>
      <div className="input-container">
        <Form.Control as="select" name="roomVisibility" ref={register} custom>
          <option value="hover">Hover</option>
          <option value="count">Count</option>
          <option value="count/name">Count and names</option>
        </Form.Control>
      </div>
    </>
  );

  const renderMapBackgroundInput = (templateID: string) => (
    <div className="input-container">
      <h4 className="italic input-header">
        {`Choose the background for your ${
          backgroundTextByVenue[templateID] ?? "Experience"
        }`}
      </h4>

      <ImageCollectionInput
        collectionPath={"assets/mapBackgrounds"}
        containerClassName="input-square-container"
        disabled={disable}
        error={errors.mapBackgroundImageFile || errors.mapBackgroundImageUrl}
        fieldName={"mapBackgroundImage"}
        image={values.mapBackgroundImageFile}
        imageClassName="input-square-image"
        imageType="backgrounds"
        imageUrl={values.mapBackgroundImageUrl}
        register={register}
        setValue={setValue}
      />
    </div>
  );

  const renderShowNametagsToggle = () => (
    <>
      <h4 className="italic input-header">
        Display user names on their avatars
      </h4>
      <label className="input-container">
        <Form.Control as="select" name="showNametags" ref={register} custom>
          <option value="none">None</option>
          {/* TODO: Implement Inline state */}
          {/* <option value="inline">Inline</option> */}
          <option value="hover">Inline and hover</option>
        </Form.Control>
      </label>
    </>
  );

  // @debt pass the header into Toggler's 'label' prop instead of being external like this
  const renderRadioToggle = () => (
    <div className="toggle-room">
      <h4 className="italic input-header">Enable venue radio</h4>
      <Toggler name="showRadio" forwardedRef={register} />
    </div>
  );

  const renderRadioStationInput = () => (
    <div className="input-container">
      <h4 className="italic input-header">Radio station stream URL:</h4>
      <input
        type="text"
        disabled={disable}
        name={`radioStations`}
        ref={register}
        className="wide-input-block input-centered align-left"
        placeholder="Radio station URL..."
      />
      {errors.radioStations && (
        <span className="input-error">{errors.radioStations.message}</span>
      )}
    </div>
  );

  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);

  const {
    isShown: hasUserStatuses,
    show: showUserStatuses,
    hide: hideUserStatuses,
    toggle: toggleUserStatus,
  } = useShowHide(DEFAULT_SHOW_USER_STATUSES);

  // Because this is not using the useForm validation. The use effect needs to manually open the dropdown with user statuses.
  useEffect(() => {
    if (!sovereignVenue) return;

    const venueUserStatuses = sovereignVenue?.userStatuses ?? [];
    const venueShowUserStatus =
      sovereignVenue?.showUserStatus ?? DEFAULT_SHOW_USER_STATUSES;

    setUserStatuses(venueUserStatuses);

    if (venueShowUserStatus) {
      showUserStatuses();
    } else {
      hideUserStatuses();
    }
  }, [hideUserStatuses, showUserStatuses, sovereignVenue]);

  const removeUserStatus = (index: number) => {
    const statuses = [...userStatuses];
    statuses.splice(index, 1);
    setUserStatuses(statuses);
  };

  const addUserStatus = () =>
    setUserStatuses([
      ...userStatuses,
      { status: "", color: DEFAULT_USER_STATUS.color },
    ]);

  const updateStatusColor = (color: string, index: number) => {
    const statuses = [...userStatuses];
    statuses[index] = { color, status: statuses[index].status };
    setUserStatuses(statuses);
  };

  const updateStatusText = (
    event: React.FormEvent<HTMLInputElement>,
    index: number
  ) => {
    const statuses = [...userStatuses];

    const userStatusExists = statuses.find(
      (userStatus) => userStatus.status === event.currentTarget.value
    );

    // @debt Move user statuses to useForm with useDynamicInput, add schema for this validation instead
    if (userStatusExists) {
      setError("User statuses", {
        type: "manual",
        message: "User status already exists.",
      });
      setFormError(true);
    } else {
      setError("", "");
      setFormError(false);
    }

    statuses[index] = {
      color: statuses[index].color,
      status: event.currentTarget.value,
    };
    setUserStatuses(statuses);
  };

  return (
    <form
      className="full-height-container"
      onSubmit={handleSubmit((vals) =>
        onSubmit(vals, userStatuses, hasUserStatuses)
      )}
    >
      <input type="hidden" name="template" value={templateID} ref={register} />
      <div className="scrollable-content">
        <h4 className="italic" style={{ fontSize: "30px" }}>{`${
          editing ? "Edit" : "Create"
        } your ${templateType}`}</h4>
        <p
          className="small light"
          style={{ marginBottom: "2rem", fontSize: "16px" }}
        >
          You can change anything except for the name of your venue later
        </p>

        {renderVenueNameInput()}
        {renderTaglineInput()}
        {renderDescriptionInput()}
        {renderRestrictToAdultsInput()}

        {renderBannerPhotoInput()}
        {renderLogoInput()}

        {templateID &&
          BANNER_MESSAGE_TEMPLATES.includes(templateID) &&
          renderAnnouncementInput()}

        {/* ATTENDEES (multiple) TITLE */}
        {renderAttendeesTitleInput()}

        {/* EVENT CHAT TITLE */}
        {renderChatTitleInput()}

        {templateID && (
          <>
            {ZOOM_URL_TEMPLATES.includes(templateID) && renderUrlInput()}
            {IFRAME_TEMPLATES.includes(templateID) &&
              renderLivestreamUrlInput()}
          </>
        )}

        {templateID &&
          BACKGROUND_IMG_TEMPLATES.includes(templateID) &&
          renderMapBackgroundInput(templateID)}

        <QuestionInput
          title="Code of conduct questions"
          fieldName="code_of_conduct_questions"
          register={register}
          hasLink
          editing={state.detailsPage?.venue.code_of_conduct_questions}
        />
        <QuestionInput
          title="Profile questions"
          fieldName="profile_questions"
          register={register}
          editing={state.detailsPage?.venue.profile_questions}
        />

        <EntranceInput
          fieldName="entrance"
          register={register}
          editing={state.detailsPage?.venue.entrance}
        />

        {renderShowScheduleToggle()}
        {templateID &&
          HAS_GRID_TEMPLATES.includes(templateID) &&
          renderShowGridToggle()}
        {renderShowBadgesToggle()}
        {renderShowNametagsToggle()}
        {templateID &&
          HAS_REACTIONS_TEMPLATES.includes(templateID) &&
          renderShowReactions()}
        {templateID &&
          HAS_REACTIONS_TEMPLATES.includes(templateID) &&
          renderShowShoutouts()}
        {renderShowRangersToggle()}
        {renderRestrictDOBToggle()}

        {templateID &&
          HAS_REACTIONS_TEMPLATES.includes(templateID) &&
          HAS_GRID_TEMPLATES.includes(templateID) &&
          renderSeatingNumberInput()}

        {renderRadioToggle()}

        <UserStatusManager
          venueId={venueId}
          checked={hasUserStatuses}
          userStatuses={userStatuses}
          onCheck={toggleUserStatus}
          onDelete={removeUserStatus}
          onAdd={addUserStatus}
          onPickColor={updateStatusColor}
          onChangeInput={updateStatusText}
        />

        {values.showRadio && renderRadioStationInput()}

        {templateID &&
          HAS_GRID_TEMPLATES.includes(templateID) &&
          values.showGrid &&
          renderGridDimensionsInputs()}

        {renderParentIdInput()}

        {templateID &&
          HAS_ROOMS_TEMPLATES.includes(templateID) &&
          renderRoomAppearanceSelect()}
      </div>

      <div className="page-container-left-bottombar">
        {previous ? (
          <button className="btn btn-primary nav-btn" onClick={previous}>
            Go Back
          </button>
        ) : (
          <div />
        )}
        <div>
          <SubmitButton
            editing={editing}
            isSubmitting={isSubmitting}
            templateType={templateType ?? "Venue"}
          />
        </div>
      </div>
      {templateID === VenueTemplate.themecamp && (
        <div style={{ textAlign: "center" }}>
          You&apos;ll be able to add rooms to your theme camp on the next page
        </div>
      )}
      {formError && (
        <div className="input-error">
          <div>One or more errors occurred when saving the form:</div>
          {Object.keys(errors).map((fieldName, index) => (
            <div key={index}>
              <span>Error in {fieldName}:</span>
              <ErrorMessage
                errors={errors}
                name={fieldName}
                as="span"
                key={fieldName}
              />
            </div>
          ))}
        </div>
      )}
    </form>
  );
};

interface SubmitButtonProps {
  isSubmitting: boolean;
  editing?: boolean;
  templateType: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting,
  editing,
  templateType,
}) => {
  return isSubmitting ? (
    <div className="spinner-border">
      <span className="sr-only">Loading...</span>
    </div>
  ) : (
    <input
      className="btn btn-primary"
      type="submit"
      value={editing ? `Update ${templateType}` : `Create ${templateType}`}
    />
  );
};
