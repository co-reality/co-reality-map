import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { makeUpdateBanner } from "api/bannerAdmin";

import { AnyVenue } from "types/venues";
import { BannerFormData } from "types/banner";

import { useShowHide } from "hooks/useShowHide";

import { Button } from "components/atoms/Button";
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
  hasCloseButton: false,
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
  const [isDisabledUrlFields, setIsDisabledUrlFields] = useState(
    venue?.banner?.isActionButton
  );

  useEffect(() => {
    setIsDisabledUrlFields(isActionButtonValue);
  }, [isActionButtonValue]);

  const updateBannerInFirestore = useCallback(
    (banner: BannerFormData) => {
      if (!venueId) return;
      makeUpdateBanner({ venueId, banner });
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
    <div className="BannerAdmin">
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          ref={register}
          name="title"
          placeholder="Please type your announcement title. (optional)"
          defaultValue={venue?.banner?.title}
          containerClassName="BannerAdmin__input-container"
          inputClassName="BannerAdmin__input-text"
          autoComplete="off"
        />

        <div className="form-group">
          <textarea
            name="content"
            defaultValue={venue?.banner?.content}
            className="BannerAdmin__input-text"
            placeholder="Please type your announcement content"
            ref={register({ required: true })}
          />
          {errors.content && errors.content.type === "required" && (
            <span className="input-error">Display content is required</span>
          )}
        </div>

        <Checkbox
          containerClassName="BannerAdmin__checkbox BannerAdmin__checkbox--action"
          labelClassName="BannerAdmin__checkbox-label"
          name="isActionButton"
          label="Call to Action Button"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.isActionButton}
        />

        <div className="BannerAdmin__action-container">
          <InputField
            ref={register}
            name="buttonUrl"
            placeholder="Button URL"
            defaultValue={venue?.banner?.buttonUrl}
            containerClassName="BannerAdmin__input-container"
            inputClassName="BannerAdmin__input-text"
            disabled={!isDisabledUrlFields}
            autoComplete="off"
          />
          <InputField
            ref={register}
            name="buttonDisplayText"
            placeholder="Button display text"
            defaultValue={venue?.banner?.buttonDisplayText}
            containerClassName="BannerAdmin__input-container"
            inputClassName="BannerAdmin__input-text"
            disabled={!isDisabledUrlFields}
            autoComplete="off"
          />
        </div>
        <Checkbox
          containerClassName="BannerAdmin__checkbox"
          name="isFullScreen"
          label="Set fullscreen announcement"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.isFullScreen}
        />

        <Checkbox
          containerClassName="BannerAdmin__checkbox"
          name="hasCloseButton"
          label="Force funnel (users will have to click your button)"
          toggler
          forwardedRef={register}
          defaultChecked={venue?.banner?.hasCloseButton}
        />

        <div className="BannerAdmin__button-container">
          <Button
            customClass="BannerAdmin__button BannerAdmin__button--close"
            onClick={clearBanner}
          >
            Clear
          </Button>
          <Button customClass="BannerAdmin__button" type="submit">
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
