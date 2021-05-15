import React, { useCallback, useMemo, useRef, useState } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import classNames from "classnames";

import {
  currentVenueSelectorData,
  radioStationsSelector,
} from "utils/selectors";
import { hasElements } from "utils/types";

import { useSelector } from "hooks/useSelector";
import { useRadio } from "hooks/useRadio";

import { RadioModal } from "components/organisms/RadioModal/RadioModal";

import "./NavBarRadio.scss";

export const NavBarRadio: React.FC = () => {
  const venue = useSelector(currentVenueSelectorData);

  const radioStations = useSelector(radioStationsSelector) ?? [];
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const hasRadioStations = radioStations && radioStations.length;
  const radioStation = !!hasRadioStations && radioStations[0];
  const isSoundCloud =
    !!hasRadioStations && RegExp("soundcloud").test(radioStations[0]);

  const sound = useMemo(
    () =>
      radioStations && hasElements(radioStations) && !isSoundCloud
        ? new Audio(radioStations[0])
        : undefined,
    [isSoundCloud, radioStations]
  );
  const handleRadioEnable = useCallback(() => setIsRadioPlaying(true), []);

  const [showRadioPopover, setShowRadioPopover] = useState(false);

  const toggleShowRadioPopover = useCallback(
    () => setShowRadioPopover((prevState) => !prevState),
    []
  );
  const { volume, setVolume } = useRadio(isRadioPlaying, sound);
  const showNormalRadio = (venue?.showRadio && !isSoundCloud) ?? false;
  const showSoundCloudRadio = (venue?.showRadio && isSoundCloud) ?? false;

  const radioFirstPlayStateLoaded = useRef(false);
  const showRadioOverlay = useMemo(() => {
    if (!radioFirstPlayStateLoaded.current) {
      const radioFirstPlayStorageKey = "radioFirstPlay";
      const radioFirstPlayState = localStorage.getItem(
        radioFirstPlayStorageKey
      );
      if (!radioFirstPlayState) {
        localStorage.setItem(radioFirstPlayStorageKey, JSON.stringify(true));
        return true;
      }
      radioFirstPlayStateLoaded.current = true;
    }
    return false;
  }, [radioFirstPlayStateLoaded]);

  if (showNormalRadio) {
    return (
      <OverlayTrigger
        trigger="click"
        placement="bottom-end"
        rootClose={true}
        defaultShow={showRadioOverlay}
        overlay={
          <Popover id="radio-popover">
            <Popover.Content>
              <RadioModal
                {...{
                  volume,
                  setVolume,
                  title: venue?.radioTitle,
                }}
                onEnableHandler={handleRadioEnable}
                isRadioPlaying={isRadioPlaying}
              />
            </Popover.Content>
          </Popover>
        }
      >
        <div
          className={classNames("profile-icon navbar-link-radio", {
            off: volume === 0,
          })}
        />
      </OverlayTrigger>
    );
  }

  const soundCloudIframeSrc = `https://w.soundcloud.com/player/?url=${radioStation}&amp;start_track=0&amp;single_active=true&amp;show_artwork=false`;

  const radioTriggerClasses = classNames("radio-trigger__iframe", {
    "radio-trigger__iframe--visible": showRadioPopover,
    "radio-trigger__iframe--hidden": !showRadioPopover,
  });

  return (
    <>
      {showSoundCloudRadio && (
        <div className="radio-trigger">
          <div
            className={classNames("profile-icon navbar-link-radio", {
              off: volume === 0,
            })}
            onClick={toggleShowRadioPopover}
          />
          <div className={radioTriggerClasses}>
            <iframe
              title="venueRadio"
              scrolling="no"
              allow="autoplay"
              src={soundCloudIframeSrc}
            />
          </div>
        </div>
      )}
    </>
  );
};
