import React from "react";

// Typings
import { LegendProps } from "./Legend.types";

// Styles
import * as S from "./Legend.styles";

// @debt Remove this and all styled-components after v3.
const Legend: React.FC<LegendProps> = ({
  text,
  position = "left",
  onClick,
  icon,
}) => {
  return (
    <S.Legend position={position} onClick={onClick} hasHoverState={!!onClick}>
      {text}
      {icon}
    </S.Legend>
  );
};

export default Legend;
