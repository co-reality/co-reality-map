import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import firebase, { UserInfo } from "firebase/app";
import {
  PLAYA_VENUE_SIZE,
  PLAYA_VENUE_STYLES,
  PLAYA_VENUE_NAME,
  JAM_IMAGE,
  PLAYA_WIDTH,
  PLAYA_HEIGHT,
} from "settings";
import { useFirestoreConnect } from "react-redux-firebase";
import { useSelector } from "hooks/useSelector";
import { PlayaContainer } from "pages/Account/Venue/VenueMapEdition";
import {
  editPlacementCastSchema,
  editPlacementSchema,
} from "./Venue/DetailsValidationSchema";
import * as Yup from "yup";
import { useForm, FieldErrors, ErrorMessage } from "react-hook-form";
import { useUser } from "hooks/useUser";
import { PlacementInput } from "api/admin";
import { ImageCollectionInput } from "components/molecules/ImageInput/ImageCollectionInput";
import { VenuePlacementState, Venue } from "types/Venue";
import { ExtractProps } from "types/utility";
import { SubmitButton } from "./Venue/DetailsForm";
import { AnyVenue } from "types/Firestore";
import { SubVenueIconMap } from "pages/Account/Venue/VenueMapEdition/Container";
import { Link } from "react-router-dom";
import { isCampVenue } from "types/CampVenue";

type FormValues = Partial<Yup.InferType<typeof editPlacementCastSchema>>;
type FormErrors = FieldErrors<Required<FormValues>>;

const isUnplaced = (venue: Venue) => {
  return (
    !venue?.placement?.state ||
    ![
      VenuePlacementState.SelfPlaced,
      VenuePlacementState.AdminPlaced,
      VenuePlacementState.Hidden,
    ].includes(venue?.placement?.state)
  );
};

const isSelfPlaced = (venue: Venue) => {
  return venue?.placement?.state === VenuePlacementState.SelfPlaced;
};

const isPlaced = (venue: Venue) => {
  return venue?.placement?.state === VenuePlacementState.AdminPlaced;
};

const isHidden = (venue: Venue) => {
  return venue?.placement?.state === VenuePlacementState.Hidden;
};

const createFirestorePlacementInput = async (
  input: PlacementInput,
  user: UserInfo
) => {
  const storageRef = firebase.storage().ref();

  const fileKey = "mapIconImageFile";

  const placementPayload = {
    ...input.placement,
    addressText: input.addressText,
    notes: input.notes,
  };

  const firestorePayload = {
    placement: placementPayload,
    mapIconImageUrl: input.mapIconImageUrl,
    width: input.width,
    height: input.height,
  };

  const fileArr = input[fileKey];
  if (!fileArr || fileArr.length === 0) {
    return firestorePayload;
  }
  const file = fileArr[0];

  const randomPrefix = Math.random().toString();
  const uploadFileRef = storageRef.child(
    `users/${user.uid}/placement/${randomPrefix}-${file.name}`
  );
  await uploadFileRef.put(file);
  const downloadUrl: string = await uploadFileRef.getDownloadURL();

  return {
    ...firestorePayload,
    mapIconImageUrl: downloadUrl,
  };
};

const updatePlacement = async (
  input: PlacementInput,
  venueId: string,
  user: UserInfo
) => {
  const firestorePlacementInput = await createFirestorePlacementInput(
    input,
    user
  );

  const payload = { ...firestorePlacementInput, id: venueId };

  return await firebase.functions().httpsCallable("venue-adminUpdatePlacement")(
    payload
  );
};

const iconPositionFieldName = "iconPosition";

const AdminEditComponent: React.FC = () => {
  const [venueId, setVenueId] = useState<string>();

  useFirestoreConnect({
    collection: "venues",
    storeAs: "playaVenues",
  });

  const venues = useSelector((state) => state.firestore.ordered.playaVenues);
  const venue = venues?.find((venue) => venue.id === venueId);
  const unplacedVenues = useMemo(() => venues?.filter(isUnplaced), [venues]);
  const selfPlacedVenues = useMemo(() => venues?.filter(isSelfPlaced), [
    venues,
  ]);
  const placedVenues = useMemo(() => venues?.filter(isPlaced), [venues]);
  const hiddenVenues = useMemo(() => venues?.filter(isHidden), [venues]);
  const defaultValues = useMemo(() => editPlacementCastSchema.cast(venue), [
    venue,
  ]);

  const { watch, register, reset, errors, ...rest } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    validationSchema: editPlacementSchema,
    validationContext: {
      template: venue?.template,
      editing: !!venue,
    },
    defaultValues,
  });

  // defaultValues gets cached from first render. Need to call reset to give the latest defaults
  useEffect(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  const { user } = useUser();
  const values = watch();

  const [formError, setFormError] = useState(false);

  //register the icon position data
  useEffect(() => {
    register("placement");
    register("width");
    register("height");
  }, [register]);

  const onSubmit = useCallback(
    async (vals: Partial<FormValues>) => {
      if (!user || !venue) return;
      try {
        // unfortunately the typing is off for react-hook-forms.
        await updatePlacement(vals as PlacementInput, venue.id, user);
        setVenueId(undefined);
      } catch (e) {
        setFormError(true);
        console.error(e);
      }
    },
    [user, venue]
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
              width: defaultValues?.width ?? PLAYA_VENUE_SIZE,
              height: defaultValues?.height ?? PLAYA_VENUE_SIZE,
              top: defaultValues?.placement?.y ?? 0,
              left: defaultValues?.placement?.x ?? 0,
              url: mapIconUrl,
            },
          }
        : undefined,
    [mapIconUrl, defaultValues]
  );

  return (
    <>
      <div className="page-container-adminpanel-placement">
        {venue && (
          <div className="venue-preview">
            <h4 className="heading">Edit venue/room links</h4>
            <div style={{ marginBottom: 10 }}>
              <b>Selected Venue:</b> {venue.name}
            </div>
            <Link
              className="btn btn-primary"
              target="_blank"
              to={`/admin/venue/edit/${venue.id}`}
            >
              Edit Venue
            </Link>
            {isCampVenue(venue) && (
              <div style={{ marginTop: 10 }}>
                <h5>Venue Rooms</h5>
                <div className="edit-rooms-container">
                  {venue.rooms.map((room, idx) => (
                    <div key={`${room.title}-${idx}`} style={{ margin: 10 }}>
                      <Link
                        className="btn btn-secondary"
                        target="_blank"
                        to={`/admin/venue/rooms/${venue.id}?roomIndex=${idx}`}
                      >
                        {`Edit Room "${room.title}"`}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="venue-preview">
          <h4 className="heading">
            Drag-and-Drop {PLAYA_VENUE_NAME} Placement
          </h4>
          {venue && venueId && iconsMap ? (
            <PlacementForm
              onSubmit={onSubmit}
              venue={venue}
              errors={errors as FormErrors}
              register={register}
              {...rest}
              values={values}
              venueId={venueId}
              setVenueId={setVenueId}
              formError={formError}
              iconsMap={iconsMap}
            />
          ) : (
            <div className="heading">
              Select a venue on the right to begin the placement process. You
              can also edit venues/rooms from this panel. The order of the
              right-hand sidebar is:
              <ul>
                <li>The venue you&apos;re currently editing</li>
                <li>
                  Self-placed venues, created and drag-and-dropped into place by
                  the placement team.
                </li>
                <li>
                  Formally placed venues, placement team has already processed
                  these. Owners cannot move them.
                </li>
                <li>
                  Hidden venues, which can be restored to admin-placed just by
                  saving them.
                </li>
                <li>
                  Unplaced venues, which don&apos;t have placement info. (They
                  are probably meant to be that way)
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="page-container-adminpanel-sidebar">
        <div className="title">Selected Venue</div>
        <ul className="venuelist">
          {!venue && <li>(no venue selected)</li>}
          {venue && <li className="selected">{venue.name}</li>}
        </ul>
        <div className="title">Self-placed Venues</div>
        <ul className="venuelist">
          {selfPlacedVenues?.map((venue, index) => (
            <li
              key={index}
              onClick={() => setVenueId(venue.id)}
              className={venue.id === venueId ? "selected" : ""}
            >
              {venue.name}
            </li>
          ))}
        </ul>
        <div className="title">Formally Placed Venues</div>
        <ul className="venuelist">
          {placedVenues?.map((venue, index) => (
            <li
              key={index}
              onClick={() => setVenueId(venue.id)}
              className={venue.id === venueId ? "selected" : ""}
            >
              {venue.name}
            </li>
          ))}
        </ul>
        <div className="title">Hidden Venues</div>
        <ul className="venuelist">
          {hiddenVenues?.map((venue, index) => (
            <li
              key={index}
              onClick={() => setVenueId(venue.id)}
              className={venue.id === venueId ? "selected" : ""}
            >
              {venue.name}
            </li>
          ))}
        </ul>
        <div className="title">Unplaced Venues</div>
        <ul className="venuelist">
          {unplacedVenues?.map((venue, index) => (
            <li
              key={index}
              onClick={() => setVenueId(venue.id)}
              className={venue.id === venueId ? "selected" : ""}
            >
              {venue.name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

interface PlacementFormProps
  extends Omit<ReturnType<typeof useForm>, "reset" | "watch"> {
  onSubmit: (vals: Partial<FormValues>) => void;
  venue: AnyVenue;
  values: FormValues;
  errors: FieldErrors<Required<FormValues>>;
  venueId: string;
  setVenueId: (val: string) => void;
  formError: boolean;
  iconsMap: SubVenueIconMap;
}

const PlacementForm: React.FC<PlacementFormProps> = (props) => {
  const {
    venue,
    onSubmit,
    handleSubmit,
    register,
    values,
    errors,
    setValue,
    venueId,
    formState: { isSubmitting },
    formError,
    iconsMap,
  } = props;

  const onFormSubmit = handleSubmit(onSubmit);

  const onBoxMove: Exclude<
    ExtractProps<typeof PlayaContainer>["onChange"],
    undefined
  > = useCallback(
    (val) => {
      if (!(iconPositionFieldName in val)) return;
      const iconPos = val[iconPositionFieldName];
      setValue("placement", {
        x: iconPos.left,
        y: iconPos.top,
      });
      setValue("width", iconPos.width);
      setValue("height", iconPos.height);
    },
    [setValue]
  );

  // This functionality is causing bugs. Leaving it in incase somebody has a chance to debug it.
  // const onOtherIconClick: Exclude<
  //   ExtractProps<typeof PlayaContainer>["onOtherIconClick"],
  //   undefined
  // > = useCallback(
  //   (val) => {
  //     setVenueId(val);
  //   },
  //   [setVenueId]
  // );

  const disable = isSubmitting;

  const placementDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientWidth = placementDivRef.current?.clientWidth ?? 0;
    const clientHeight = placementDivRef.current?.clientHeight ?? 0;

    placementDivRef.current?.scrollTo(
      (venue.placement?.x ?? 0) - clientWidth / 2,
      (venue.placement?.y ?? 0) - clientHeight / 2
    );
  }, [venue]);

  return (
    <form onSubmit={onFormSubmit}>
      <>
        <div className="content-group">
          <div className="banner">
            <h4 className="italic">Selected venue:</h4>
            {venue?.name}
          </div>
          {venue?.placementRequests && (
            <div className="banner">
              <h4 className="italic">{`Camp owner's placement requests:`}</h4>
              {venue?.placementRequests}
            </div>
          )}
        </div>
        <div className="content-group">
          <h4 className="italic" style={{ fontSize: "20px" }}>
            Venue icon which will appear on the map
          </h4>
          <ImageCollectionInput
            collectionPath={"assets/mapIcons2"}
            disabled={false}
            fieldName={"mapIconImage"}
            register={register}
            imageUrl={values.mapIconImageUrl}
            containerClassName="input-square-container"
            imageClassName="input-square-image"
            image={values.mapIconImageFile}
            error={errors.mapIconImageFile || errors.mapIconImageUrl}
            setValue={setValue}
            imageType="icons"
          />
        </div>
        <div className="content-group">
          <h4 className="italic" style={{ fontSize: "20px" }}>
            Location on the map
          </h4>
          <div
            className="playa"
            ref={placementDivRef}
            style={{ width: "100%", height: 1000, overflow: "scroll" }}
          >
            <PlayaContainer
              interactive
              resizable={true}
              coordinatesBoundary={{
                width: PLAYA_WIDTH,
                height: PLAYA_HEIGHT,
              }}
              onChange={onBoxMove}
              snapToGrid={false}
              iconsMap={iconsMap ?? {}}
              backgroundImage={JAM_IMAGE}
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
        <div className="content-group">
          <div className="input-container">
            <h4 className="italic" style={{ fontSize: "20px" }}>
              Address in the city grid (shown to burners)
            </h4>
            <input
              disabled={disable}
              name="addressText"
              ref={register}
              className="align-left"
              placeholder={`Example: 8:00 & B`}
            />
            {errors.addressText && (
              <span className="input-error">{errors.addressText.message}</span>
            )}
          </div>
          <div className="input-container">
            <h4 className="italic" style={{ fontSize: "20px" }}>
              Placement notes (for the placement team only)
            </h4>
            <input
              disabled={disable}
              name="notes"
              ref={register}
              className="align-left"
              placeholder={`Example: requested a quiet area`}
            />
            {errors.notes && (
              <span className="input-error">{errors.notes.message}</span>
            )}
          </div>
        </div>
        <div className="page-container-left-bottombar">
          <div>
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
            <SubmitButton
              editing
              isSubmitting={isSubmitting}
              templateType={venue?.template ?? "Venue"}
            />
          </div>
        </div>
      </>
    </form>
  );
};

export default AdminEditComponent;
