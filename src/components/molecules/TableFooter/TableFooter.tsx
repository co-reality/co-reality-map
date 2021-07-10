import React from "react";

import { Toggler } from "components/atoms/Toggler";

export interface TableFooterProps {
  isVideoFocused: boolean;
  setIsVideoFocused: (val: boolean) => void;
}

const TableFooter: React.FC<TableFooterProps> = ({
  isVideoFocused,
  setIsVideoFocused,
}) => (
  <div className="table-footer">
    <div className="actions">
      <div className="action">
        <div className="focus">Focus on:</div>
        <div className="focus-option">Jazz</div>
        <Toggler
          checked={!isVideoFocused}
          onChange={() => setIsVideoFocused(!isVideoFocused)}
        />
        <div className="focus-option">Friends</div>
      </div>
    </div>
  </div>
);

export default TableFooter;
