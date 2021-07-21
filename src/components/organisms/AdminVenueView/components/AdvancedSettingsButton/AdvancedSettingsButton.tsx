import React from "react";
import { adminNGSettigsUrl } from "../../../../../utils/url";

import "./AdvancedSettingsButton.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";

type Props = Readonly<{ id?: string }>;

export const AdvancedSettingsButton: React.FC<Props> = ({ id }) => (
  <a className="btn btn-lg AdvancedSettingsButton" href={adminNGSettigsUrl(id)}>
    <div className="AdvancedSettingsButton__container">
      <div className="AdvancedSettingsButton__icon">
        <FontAwesomeIcon icon={faCog} size="2x" />
      </div>
      <div className="AdvancedSettingsButton__title">Advanced settings</div>
      <div className="AdvancedSettingsButton__subtitle">
        Party info, splash page, entrance...
      </div>
    </div>
  </a>
);
