import React from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { faCog } from "@fortawesome/free-solid-svg-icons";

import { Toggler } from "components/atoms/Toggler";

import { PosterPageControl } from "../PosterPageControl";

import "./PosterPageSettingsControl.scss";

export interface PosterPageSettingsControlProps {
  setVenueLiveOff: () => void;
  setVenueLiveOn: () => void;
  isPosterLive?: boolean;
}

export const PosterPageSettingsControl: React.FC<PosterPageSettingsControlProps> = ({
  isPosterLive,
  setVenueLiveOff,
  setVenueLiveOn,
}) => (
  <OverlayTrigger
    trigger="click"
    placement="bottom-end"
    overlay={
      <Popover
        id="poster-page-settings-popover"
        className="PosterPageSettingsControl__popover"
      >
        <Popover.Content className="PosterPageSettingsControl__popover-content">
          <Toggler
            type="checkbox"
            checked={!!isPosterLive}
            onChange={isPosterLive ? setVenueLiveOff : setVenueLiveOn}
            title={isPosterLive ? "Poster is live" : "Make poster live"}
          />
        </Popover.Content>
      </Popover>
    }
    rootClose={true}
  >
    <PosterPageControl label="Settings" icon={faCog} />
  </OverlayTrigger>
);