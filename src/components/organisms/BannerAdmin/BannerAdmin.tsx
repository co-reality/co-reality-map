import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import classNames from "classnames";

import { makeUpdateBanner } from "api/bannerAdmin";

import { AnyVenue } from "types/venues";
import { Banner } from "types/banner";

import { useShowHide } from "hooks/useShowHide";

import { Button } from "components/atoms/Button";
import { Checkbox } from "components/atoms/Checkbox";
import { InputField } from "components/atoms/InputField";
import { ConfirmationModal } from "components/atoms/ConfirmationModal/ConfirmationModal";

import "./BannerAdmin.scss";
import { useAsyncFn } from "react-use";

interface BannerAdminProps {
  venueId?: string;
  venue: AnyVenue;
  onClose?: () => void;
}

// @debt This component is almost exactly the same as IframeAdmin, we should refactor them both to use the same generic base component
//   BannerAdmin is the 'canonical example' to follow when we do this
export const BannerAdmin: React.FC<BannerAdminProps> = ({
  venueId,
  venue,
  onClose,
}) => {
  const { register, handleSubmit, errors, reset, watch } = useForm<Banner>({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const isUrlButtonActive = watch(
    "isActionButton",
    venue?.banner?.isActionButton
  );

  const {
    isShown: isShowBannerChangeModal,
    show: showBannerChangeModal,
    hide: hideBannerChangeModal,
  } = useShowHide();

  const [{ loading: isUpdatingBanner }, saveBanner] = useAsyncFn(
    async (banner?: Banner) => {
      if (!venueId) return;

      await makeUpdateBanner({ venueId, banner });
      onClose && onClose();
    },
    [venueId, onClose]
  );

  const clearBanner = useCallback(() => {
    showBannerChangeModal();

    reset();
  }, [showBannerChangeModal, reset]);

  const confirmChangeBannerData = useCallback(() => {
    saveBanner(undefined);
    hideBannerChangeModal();
  }, [saveBanner, hideBannerChangeModal]);

  const forceFunnelLabelClasses = classNames("BannerAdmin__checkbox__label", {
    BannerAdmin__checkbox__label__disabled: !isUrlButtonActive,
  });

  return (
    <div className="BannerAdmin">
      <form onSubmit={handleSubmit(saveBanner)}>
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
            ref={register({ required: true })}
            name="content"
            defaultValue={venue?.banner?.content}
            className="BannerAdmin__input-text"
            placeholder="Please type your announcement content"
          />
          {errors.content && errors.content.type === "required" && (
            <span className="input-error">Display content is required</span>
          )}
        </div>

        <Checkbox
          containerClassName="BannerAdmin__checkbox BannerAdmin__checkbox--action"
          labelClassName="BannerAdmin__checkbox__label"
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
            disabled={!isUrlButtonActive}
            autoComplete="off"
          />
          <InputField
            ref={register}
            name="buttonDisplayText"
            placeholder="Button display text"
            defaultValue={venue?.banner?.buttonDisplayText}
            containerClassName="BannerAdmin__input-container"
            inputClassName="BannerAdmin__input-text"
            disabled={!isUrlButtonActive}
            autoComplete="off"
          />
        </div>
        <Checkbox
          forwardedRef={register}
          containerClassName="BannerAdmin__checkbox"
          labelClassName="BannerAdmin__checkbox__label"
          name="isFullScreen"
          label="Set fullscreen announcement"
          toggler
          defaultChecked={venue?.banner?.isFullScreen}
        />

        <Checkbox
          forwardedRef={register}
          containerClassName="BannerAdmin__checkbox"
          labelClassName={forceFunnelLabelClasses}
          name="isForceFunnel"
          label="Force funnel (users will have to click your button)"
          toggler
          defaultChecked={venue?.banner?.isForceFunnel}
          disabled={!isUrlButtonActive}
        />

        <div className="BannerAdmin__button-container">
          <Button
            customClass="BannerAdmin__button BannerAdmin__button--close"
            onClick={clearBanner}
            disabled={isUpdatingBanner}
          >
            Clear
          </Button>
          <Button
            customClass="BannerAdmin__button"
            type="submit"
            disabled={isUpdatingBanner}
          >
            Save
          </Button>
        </div>
      </form>

      <ConfirmationModal
        show={isShowBannerChangeModal}
        onConfirm={confirmChangeBannerData}
        onCancel={hideBannerChangeModal}
        header={"Erase your beautiful work?"}
        message={"Are you sure?"}
        saveBtnLabel="Clear & Save"
        cancelBtnLabel="Cancel"
        containerClassName={"ConfirmationModal"}
        headerClassName={"ConfirmationModal__header"}
        messageClassName={"ConfirmationModal__message"}
        buttonsContainerClassName={"ConfirmationModal__buttons"}
        buttonClassName={"ConfirmationModal__button"}
        cancelButtonClassName={
          "ConfirmationModal__button  ConfirmationModal__button--cancel"
        }
        isCentered
      />
    </div>
  );
};
