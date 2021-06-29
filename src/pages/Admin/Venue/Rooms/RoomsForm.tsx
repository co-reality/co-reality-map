import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFirestore } from "react-redux-firebase";
import { useHistory } from "react-router-dom";
import { ErrorMessage, useForm } from "react-hook-form";

import Bugsnag from "@bugsnag/js";
import * as Yup from "yup";

import {
  ALL_VENUE_TEMPLATES,
  PLAYA_IMAGE,
  PLAYA_ICON_SIDE_PERCENTAGE,
  PLAYA_VENUE_STYLES,
  HAS_ROOMS_TEMPLATES,
} from "settings";

import { upsertRoom, RoomInput } from "api/admin";

import { Room } from "types/rooms";
import { ExtractProps } from "types/utility";
import { PartyMapVenue, AnyVenue } from "types/venues";

import { withId } from "utils/id";

import { useUser } from "hooks/useUser";
import { useQuery } from "hooks/useQuery";
import { useVenueId } from "hooks/useVenueId";

import Login from "pages/Account/Login";
import { RoomsContainer } from "pages/Account/Venue/VenueMapEdition";
import { SubVenueIconMap } from "pages/Account/Venue/VenueMapEdition/Container";

import WithNavigationBar from "components/organisms/WithNavigationBar";

import { ImageInput } from "components/molecules/ImageInput";

import { validationSchema } from "./RoomsValidationSchema";

import "../Venue.scss";

import RoomDeleteModal from "./RoomDeleteModal";

export const RoomsForm: React.FC = () => {
  const venueId = useVenueId();
  const history = useHistory();
  const { user } = useUser();
  const firestore = useFirestore();
  const [venue, setVenue] = useState<PartyMapVenue>();
  const queryParams = useQuery();
  const queryRoomIndexString = queryParams.get("roomIndex");
  const queryRoomIndex = queryRoomIndexString
    ? parseInt(queryRoomIndexString)
    : undefined;

  useEffect(() => {
    if (!venueId) return history.replace("/admin");

    const fetchVenueFromAPI = async () => {
      const venueSnapshot = await firestore
        .collection("venues")
        .doc(venueId)
        .get();

      if (!venueSnapshot.exists) return history.replace("/admin");

      const data = venueSnapshot.data() as AnyVenue;
      //find the template
      const template = ALL_VENUE_TEMPLATES.find(
        (template) => data.template === template.template
      );

      if (!template || !HAS_ROOMS_TEMPLATES.includes(template.template)) {
        history.replace("/admin");
      }
      setVenue(data as PartyMapVenue);
    };
    fetchVenueFromAPI();
  }, [firestore, venueId, history]);

  const room = useMemo(() => {
    if (
      typeof queryRoomIndex === "undefined" ||
      !venue ||
      !venue.rooms ||
      venue.rooms.length - 1 < queryRoomIndex
    )
      return undefined;

    return venue.rooms[queryRoomIndex];
  }, [queryRoomIndex, venue]);

  if (!venue || !venueId) return null;

  if (!user) {
    return <Login formType="login" venue={withId(venue, venueId)} />;
  }

  return (
    <WithNavigationBar fullscreen>
      <RoomInnerForm
        venueId={venueId}
        venue={venue}
        editingRoom={room}
        editingRoomIndex={queryRoomIndex}
      />
    </WithNavigationBar>
  );
};

interface RoomInnerFormProps {
  venueId: string;
  venue: PartyMapVenue;
  editingRoom?: Room;
  editingRoomIndex?: number;
}

export type FormValues = Yup.InferType<typeof validationSchema>;

const RoomInnerForm: React.FC<RoomInnerFormProps> = (props) => {
  const { venue, venueId, editingRoom, editingRoomIndex } = props;

  const defaultValues = useMemo(() => validationSchema.cast(editingRoom), [
    editingRoom,
  ]);

  const {
    watch,
    register,
    handleSubmit,
    errors,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    validationSchema: validationSchema,
    validationContext: { editing: !!editingRoom },
    defaultValues,
  });

  const { user } = useUser();
  const history = useHistory();

  const values = watch();
  const disable = isSubmitting;

  const [formError, setFormError] = useState(false);

  const onSubmit = useCallback(
    async (vals: FormValues) => {
      if (!user) return;

      try {
        const roomValues: RoomInput = {
          ...editingRoom,
          ...vals,
        };
        await upsertRoom(roomValues, venueId, user, editingRoomIndex);
        history.push(`/admin/${venueId}`);
      } catch (e) {
        setFormError(true);
        Bugsnag.notify(e, (event) => {
          event.addMetadata("Admin::RoomsForm::onSubmit", {
            venueId,
            vals,
            editingRoomIndex,
          });
        });
      }
    },
    [user, history, venueId, editingRoomIndex, editingRoom]
  );

  useEffect(() => {
    register("x_percent");
    register("y_percent");
    register("width_percent");
    register("height_percent");
  }, [register]);

  const iconPositionFieldName = "iconPosition";
  const onBoxChange: ExtractProps<
    typeof RoomsContainer
  >["onChange"] = useCallback(
    (val) => {
      if (!(iconPositionFieldName in val)) return;
      const iconPos = val[iconPositionFieldName];
      setValue("x_percent", iconPos.left);
      setValue("y_percent", iconPos.top);
      setValue("width_percent", iconPos.width);
      setValue("height_percent", iconPos.height);
    },
    [setValue]
  );

  const imageUrl = useMemo(
    () =>
      values.image_file && values.image_file.length > 0
        ? URL.createObjectURL(values.image_file[0])
        : values.image_url,
    [values.image_file, values.image_url]
  );

  const currentRoomIcon = useMemo(
    (): SubVenueIconMap =>
      imageUrl
        ? {
            [iconPositionFieldName]: {
              width: values.width_percent || PLAYA_ICON_SIDE_PERCENTAGE,
              height: values.height_percent || PLAYA_ICON_SIDE_PERCENTAGE,
              left: values.x_percent || 0,
              top: values.y_percent || 0,
              url: imageUrl,
            },
          }
        : {},
    [
      imageUrl,
      values.x_percent,
      values.y_percent,
      values.width_percent,
      values.height_percent,
    ]
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="page">
        <div className="page-side">
          <div className="page-container-left">
            <div className="page-container-left-content">
              <form
                className="full-height-container"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="scrollable-content">
                  <h4 className="italic">{`${
                    editingRoom ? "Edit your" : "Add a"
                  } room`}</h4>
                  <p className="small light" style={{ marginBottom: "2rem" }}>
                    You can update everything in this form at a later date on
                    the edit page
                  </p>
                  <div className="input-container">
                    <div className="input-title">Name your Room</div>
                    <input
                      disabled={disable}
                      name="title"
                      ref={register}
                      className="align-left"
                      placeholder={`My room title`}
                    />
                    {errors.title && (
                      <span className="input-error">
                        {errors.title.message}
                      </span>
                    )}
                  </div>

                  <div className="input-container">
                    <div className="input-title">
                      Upload an image for how your room should appear on the
                      camp map
                    </div>
                    <ImageInput
                      disabled={disable}
                      name={"image_file"}
                      image={values.image_file}
                      remoteUrlInputName={"image_url"}
                      remoteImageUrl={values.image_url}
                      containerClassName="input-square-container"
                      ref={register}
                      error={errors.image_file || errors.image_url}
                    />
                  </div>
                  <div className="input-container">
                    <div className="input-title">Give your room a subtitle</div>
                    <input
                      name="subtitle"
                      disabled={disable}
                      ref={register}
                      className="align-left"
                      placeholder={`My room subtitle`}
                    />
                    {errors.subtitle && (
                      <span className="input-error">
                        {errors.subtitle.message}
                      </span>
                    )}
                  </div>
                  <div className="input-container">
                    <div className="input-title">About your room</div>
                    <textarea
                      disabled={disable}
                      name={"about"}
                      ref={register}
                      className="wide-input-block input-centered align-left"
                      placeholder={"Describe your room in detail"}
                    />
                    {errors.about && (
                      <span className="input-error">
                        {errors.about.message}
                      </span>
                    )}
                  </div>
                  <div className="input-container">
                    <div className="input-title">The room url</div>
                    <input
                      disabled={disable}
                      name={"url"}
                      ref={register}
                      className="wide-input-block align-left"
                      placeholder={"The url this room will redirect to"}
                    />
                    {errors.url && (
                      <span className="input-error">{errors.url.message}</span>
                    )}
                  </div>
                  <div className="toggle-room">
                    <div className="input-title">Enabled ?</div>
                    <label className="switch">
                      <input
                        disabled={disable}
                        type="checkbox"
                        id="isEnabled"
                        name={"isEnabled"}
                        ref={register}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="toggle-room">
                    <div className="input-title">Is label hidden?</div>
                    <label className="switch">
                      <input
                        disabled={disable}
                        type="checkbox"
                        id="isLabeled"
                        name={"isLabeled"}
                        ref={register}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
                <div className="page-container-left-bottombar">
                  <div />
                  <div>
                    <SubmitButton
                      editing={!!editingRoom}
                      isSubmitting={isSubmitting}
                    />
                    {editingRoom && !isSubmitting && (
                      <button
                        type={"button"}
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete room
                      </button>
                    )}
                  </div>
                  {formError && (
                    <div className="input-error">
                      <div>
                        One or more errors occurred when saving the form:
                      </div>
                      {Object.keys(errors).map((fieldName) => (
                        <div key={fieldName}>
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
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="page-side preview">
          <h4
            className="italic"
            style={{ textAlign: "center", fontSize: "22px" }}
          >
            Position your room in the camp
          </h4>
          <p>
            First upload or select the icon you would like to appear in your
            camp, then drag it around to position it
          </p>
          <div className="playa">
            {venue.mapBackgroundImageUrl && (
              <RoomsContainer
                interactive
                resizable
                coordinatesBoundary={{
                  width: 100,
                  height: 100,
                }}
                onChange={onBoxChange}
                snapToGrid={false}
                iconsMap={currentRoomIcon}
                backgroundImage={venue.mapBackgroundImageUrl || PLAYA_IMAGE}
                iconImageStyle={PLAYA_VENUE_STYLES.iconImage}
                draggableIconImageStyle={PLAYA_VENUE_STYLES.draggableIconImage}
                rooms={venue.rooms ?? []}
                currentRoomIndex={editingRoomIndex}
                otherIconsStyle={{ opacity: 0.4 }}
              />
            )}
          </div>
        </div>
      </div>
      {!!editingRoom && (
        <RoomDeleteModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
          }}
          venueId={venueId}
          room={editingRoom}
        />
      )}
    </>
  );
};

interface SubmitButtonProps {
  isSubmitting: boolean;
  editing?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting,
  editing,
}) => {
  return isSubmitting ? (
    <div className="spinner-border">
      <span className="sr-only">Loading...</span>
    </div>
  ) : (
    <button className="btn btn-primary" type="submit">
      {editing ? "Update room" : "Create room"}
    </button>
  );
};
