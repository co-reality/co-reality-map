import classNames from "classnames";
import React, {
  DetailedHTMLProps,
  forwardRef,
  InputHTMLAttributes,
} from "react";
import { v4 as uuidv4 } from "uuid";

import "./Toggler.scss";

export interface TogglerProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  title?: string;
  containerClassName?: string;
  inputClassName?: string;
}

const Toggler: React.ForwardRefRenderFunction<HTMLDivElement, TogglerProps> = (
  {
    containerClassName,
    inputClassName,
    title,
    // In case id is not provided, generate one. It's requires so that htmlFor works correctly
    id = uuidv4(),
    ...extraInputProps
  },
  ref
) => {
  const sliderClasses = classNames("Toggler__slider", {
    "Toggler__slider--checked": extraInputProps.checked,
  });

  return (
    <div ref={ref} className="Toggler">
      <label className="Toggler__input" htmlFor={id}>
        <span className={sliderClasses} />
      </label>
      <input hidden type="checkbox" {...extraInputProps} id={id} />
      {title && <div className="Toggler__title">{title}</div>}
    </div>
  );
};

export default forwardRef(Toggler);
