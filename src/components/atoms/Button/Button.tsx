import React, { CSSProperties } from "react";
import { Link } from "react-router-dom";

import * as S from "./Button.styles";

interface LinkProps {
  isLink?: boolean;
  linkTo?: string;
}

export interface ButtonProps extends LinkProps {
  customClass?: string;
  customStyle?: CSSProperties;
  gradient?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "reset" | "submit";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  customClass,
  loading,
  onClick,
  type = "button",
  customStyle,
  children,
  gradient,
  isLink = false,
  linkTo,
  disabled = false,
}) => {
  if (loading)
    return (
      <div className="spinner-border">
        <span className="sr-only">Loading&hellip;</span>
      </div>
    );

  if (isLink) {
    return (
      <S.Button
        as={Link}
        className={customClass}
        style={customStyle}
        to={linkTo!}
      >
        {children}
      </S.Button>
    );
  }

  return (
    <S.Button
      className={customClass}
      style={customStyle}
      type={type}
      onClick={onClick}
      hasGradient={gradient}
      disabled={disabled}
    >
      {children}
    </S.Button>
  );
};
