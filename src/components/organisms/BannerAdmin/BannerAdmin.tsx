import React, { useCallback } from "react";
import { useForm } from "react-hook-form";

// import { makeUpdateBanner } from "api/bannerAdmin";

import { AnyVenue } from "types/venues";
import { BannerFormData } from "types/banner";

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
}

// @debt This component is almost exactly the same as IframeAdmin, we should refactor them both to use the same generic base component
//   BannerAdmin is the 'canonical example' to follow when we do this
export const BannerAdmin: React.FC<BannerAdminProps> = ({ venueId, venue }) => {
  const { register, handleSubmit, reset } = useForm<BannerFormData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const updateBannerInFirestore = useCallback(
    (data: BannerFormData) => {
      if (!venueId) return;

      // makeUpdateBanner(venueId)(data);
    },
    [venueId]
  );

  const onSubmit = (data: BannerFormData) => {
    updateBannerInFirestore(data);
  };

  const clearBanner = useCallback(() => {
    updateBannerInFirestore(initialBannerData);
    reset();
  }, [updateBannerInFirestore, reset]);

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                ref={register({ required: true })}
                name="title"
                type="text"
                placeholder="Please type your announcement title. (optional)"
                autoComplete="off"
                className="Banner__input-text"
              />
            </div>

            <div className="form-group">
              <textarea
                name="content"
                className="Banner__input-text"
                placeholder="Please type your announcement content"
                ref={register}
              />
            </div>

            <div className="BannerToggle">
              <label id={"isActionButton"} className="switch">
                <input
                  type="checkbox"
                  id={"isActionButton"}
                  name={"isActionButton"}
                  ref={register}
                />
                <span className="slider round"></span>
              </label>
              <span className="BannerToggle__title">Call to Action Button</span>
            </div>

            <div className="Banner__action-container">
              <div className="form-group">
                <input
                  ref={register}
                  name="buttonUrl"
                  type="text"
                  placeholder="Button URL"
                  autoComplete="off"
                  className="Banner__input-text"
                />
              </div>

              <div className="form-group">
                <input
                  ref={register}
                  name="buttonDisplayText"
                  type="text"
                  placeholder="Button display text"
                  autoComplete="off"
                  className="Banner__input-text"
                />
              </div>
            </div>

            <div className="BannerToggle">
              <label id={"isFullScreen"} className="switch">
                <input
                  type="checkbox"
                  id={"isFullScreen"}
                  name={"isFullScreen"}
                  ref={register}
                />
                <span className="slider round"></span>
              </label>
              <span className="BannerToggle__title">
                Set fullscreen announcement
              </span>
            </div>

            <div className="BannerToggle">
              <label id={"isCloseButton"} className="switch">
                <input
                  type="checkbox"
                  id={"isCloseButton"}
                  name={"isCloseButton"}
                  ref={register}
                />
                <span className="slider round"></span>
              </label>
              <span className="BannerToggle__title">
                Force funnel (users will have to click your button)
              </span>
            </div>

            <div className="form-inline justify-content-between Banner__button-container">
              <button
                className="btn btn-danger"
                type="reset"
                onClick={clearBanner}
              >
                Clear
              </button>

              <button className="btn btn-primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
