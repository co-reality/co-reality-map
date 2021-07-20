import classNames from "classnames";
import React from "react";

import "./ScheduleScaleFactor.scss";

const SCHEDULE_SCALE_FACTORS: { name: string; value: number }[] = [
  {
    name: "15min",
    value: 4,
  },
  {
    name: "1h",
    value: 1,
  },
  {
    name: "4h",
    value: 0.25,
  },
];

export interface ScheduleScaleFactorProps {
  onChange: (value: number) => void;
  value: number;
}

const _ScheduleScaleFactor: React.FC<ScheduleScaleFactorProps> = ({
  onChange,
  value,
}) => {
  return (
    <div className="ScheduleScaleFactor">
      {SCHEDULE_SCALE_FACTORS.map(({ name, value: factorValue }) => {
        return (
          <button
            className={classNames("ScheduleScaleFactor__factorButton", {
              "ScheduleScaleFactor__factorButton--active":
                value === factorValue,
            })}
            key={name}
            onClick={() => onChange(factorValue)}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
};

export const ScheduleScaleFactor = _ScheduleScaleFactor;
