import React, { forwardRef } from "react";
import classNames from "classnames";
import { KeyboardShortcutKeys } from "settings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { isTruthy } from "utils/types";

import "./InputField.scss";

export interface InputFieldProps extends React.HTMLProps<HTMLInputElement> {
  containerClassName?: string;
  inputClassName?: string;
  iconStart?: IconProp | JSX.Element;
  iconEnd?: IconProp | JSX.Element;
}

const isJsxElement = (
  component: IconProp | JSX.Element
): component is JSX.Element => {
  return isTruthy(component?.hasOwnProperty("props"));
};

const renderIcon = (
  icon: IconProp | JSX.Element,
  modifiedClassName: string
): JSX.Element => {
  const iconComponent = isJsxElement(icon) ? (
    icon
  ) : (
    <FontAwesomeIcon icon={icon} />
  );

  return (
    <div className={classNames("input-field__icon", modifiedClassName)}>
      {iconComponent}
    </div>
  );
};

const InputField: React.ForwardRefRenderFunction<
  HTMLInputElement,
  InputFieldProps
> = (
  {
    containerClassName,
    inputClassName,
    iconStart,
    iconEnd,
    ...extraInputProps
  },
  ref
) => {
  const containerClassNames = classNames(
    "input-field",
    {
      "input-field--icon-start": isTruthy(iconStart),
      "input-field--icon-end": isTruthy(iconEnd),
    },
    containerClassName
  );

  const inputClassNames = classNames("input-field__input", inputClassName);

  // @debt Replace this with useMousetrap when we fix it to bind refs (not just globally)
  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key.toLowerCase() === KeyboardShortcutKeys.inputField.deselect &&
      e.target
    ) {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={containerClassNames}>
      <input
        ref={ref}
        className={inputClassNames}
        onKeyDown={keyDown}
        {...extraInputProps}
      />

      {iconStart && renderIcon(iconStart, "input-field__icon--start")}
      {iconEnd && renderIcon(iconEnd, "input-field__icon--end")}
    </div>
  );
};

export default forwardRef(InputField);
