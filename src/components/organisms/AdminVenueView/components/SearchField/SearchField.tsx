import { debounce } from "lodash";
import React, { useState, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons/faTimesCircle";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import "./SearchField.scss";

type onChange = (value: string) => void;
type CustomInputProps = "value" | "onChange"; // we override the types of these standard props

export interface SearchUsersProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, CustomInputProps> {
  onChange?: onChange;
  value?: string;
  placeholder?: string;
  debounceTime?: number;
}

export const SearchField: React.FC<SearchUsersProps> = ({
  onChange,
  value = "",
  debounceTime = 100,
  ...props
}) => {
  const [text, setText] = useState(value);
  const debouncedHandleChange: onChange = useMemo(
    () => debounce((value) => onChange?.(value), debounceTime),
    [debounceTime, onChange]
  );

  const cn = classNames({
    "SearchField SearchField--empty": !text,
    "SearchField SearchField--full": text,
  });

  const ref = React.createRef<HTMLInputElement>();
  const refocus = () => ref.current?.focus();

  return (
    <div className={cn} onFocus={refocus} onClick={refocus}>
      <FontAwesomeIcon className="SearchField__icon" icon={faSearch} />
      <input
        className="SearchField__input"
        value={text}
        onChange={(event) => {
          const text = event.target.value;
          setText(text);
          debouncedHandleChange(text);
        }}
        ref={ref}
        {...props}
      />
      {text && (
        <FontAwesomeIcon
          className="SearchField__icon"
          icon={faTimesCircle}
          onClick={() => setText("")}
        />
      )}
    </div>
  );
};
