import React, { useCallback, useState } from "react";
import { Button } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { makeUpdateBanner } from "api/bannerAdmin";

import { AnyVenue } from "types/venues";
import { BannerFormData } from "types/banner";

import { useShowHide } from "hooks/useShowHide";

import { Checkbox } from "components/atoms/Checkbox";
import { InputField } from "components/atoms/InputField";

import { ConfirmationBannerModal } from "./ConfirmationBannerModal";

import "./BannerAdmin.scss";

const initialBannerData = {
  title: "",
  content: "",
  isActionButton: false,
  buttonUrl: "",
  buttonDisplayText: "",
  isFullScreen: false,
  isCloseButton: false,
};

interface BannerAdminProps {
  venueId?: string;
  venue: AnyVenue;
  onClose: () => void;
}

// @debt This component is almost exactly the same as IframeAdmin, we should refactor them both to use the same generic base component
//   BannerAdmin is the 'canonical example' to follow when we do this
export const BannerAdmin: React.FC<BannerAdminProps> = ({
  venueId,
  venue,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    errors,
    reset,
    watch,
  } = useForm<BannerFormData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const isActionButtonValue = watch("isActionButton");

  const [bannerData, setBannerDate] = useState<BannerFormData>(
    initialBannerData
  );

  const {
    isShown: isShowModal,
    show: showModal,
    hide: hideModal,
  } = useShowHide();

  const updateBannerInFirestore = useCallback(
    (data: BannerFormData) => {
      if (!venueId) return;
      makeUpdateBanner(venueId)(data);
      onClose();
    },
    [venueId, onClose]
  );

  const onSubmit = useCallback(
    (data: BannerFormData) => {
      showModal();
      setBannerDate(data);
    },
    [showModal]
  );

  const clearBanner = useCallback(() => {
    updateBannerInFirestore(initialBannerData);
    reset();
  }, [updateBannerInFirestore, reset]);

  const confirmChangeBannerData = useCallback(() => {
    updateBannerInFirestore(bannerData);
    hideModal();
  }, [bannerData, updateBannerInFirestore, hideModal]);

  return (
    <div className="Banner">
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          ref={register}
          name="title"
          placeholder="Please type your announcement title. (optional)"
          defaultValue={venue?.banner?.title}
          containerClassName="Banner__input-container"
          inputClassName="Banner__input-text"
          autoComplete="off"
        />

        <div className="form-group">
          <textarea
            name="content"
            defaultValue={venue?.banner?.content}
            className="Banner__input-text"
            placeholder="Please type your announcement content"
            ref={register({ required: true })}
          />
          {errors.content && errors.content.type === "required" && (
            <span className="input-error">Display content is required</span>
          )}
        </div>

        <Checkbox
          containerClassName="Banner__checkbox Banner__checkbox--action"
          labelClassName="Banner__checkbox-label"
          name="isActionButton"
          label="Call to Action Button"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.isActionButton}
        />

        <div className="Banner__action-container">
          <InputField
            ref={register}
            name="buttonUrl"
            placeholder="Button URL"
            defaultValue={venue?.banner?.buttonUrl}
            containerClassName="Banner__input-container"
            inputClassName="Banner__input-text"
            disabled={!isActionButtonValue}
            autoComplete="off"
          />
          <InputField
            ref={register}
            name="buttonDisplayText"
            placeholder="Button display text"
            defaultValue={venue?.banner?.buttonDisplayText}
            containerClassName="Banner__input-container"
            inputClassName="Banner__input-text"
            disabled={!isActionButtonValue}
            autoComplete="off"
          />
        </div>
        <Checkbox
          containerClassName="Banner__checkbox"
          name="isFullScreen"
          label="Set fullscreen announcement"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.isFullScreen}
        />

        <Checkbox
          containerClassName="Banner__checkbox"
          name="isCloseButton"
          label="Force funnel (users will have to click your button)"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.isCloseButton}
        />

        <div className="Banner__button-container">
          <Button
            className="Banner__button"
            variant="danger"
            onClick={clearBanner}
          >
            Clear
          </Button>
          <Button className="Banner__button" type="submit">
            Save
          </Button>
        </div>
      </form>

      <ConfirmationBannerModal
        show={isShowModal}
        onConfirm={confirmChangeBannerData}
        onCancel={hideModal}
      />
    </div>
  );
};
