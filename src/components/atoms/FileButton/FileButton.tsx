import React, { useCallback } from "react";
import classNames from "classnames";

import "./FileButton.scss";

export interface FileButtonProps {
  title: string;
  description?: string;
  disabled?: boolean;
  onChange: (url: string, file: FileList) => void;
}

export const FileButton: React.FC<FileButtonProps> = ({
  title,
  description,
  disabled,
  onChange,
}) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;

      if (!files || disabled) return;

      const url = URL.createObjectURL(files[0]);

      onChange(url, files);
    },
    [disabled, onChange]
  );

  const buttonClasses = classNames("btn btn-primary", {
    "btn-disabled": disabled,
  });

  return (
    <div className="FileButton">
      <button className={buttonClasses} disabled={disabled}>
        <label className="FileButton__label" htmlFor="fileButton">
          {title}
        </label>
      </button>

      <input
        hidden
        type="file"
        id="fileButton"
        disabled={disabled}
        onChange={handleChange}
      />

      {description && (
        <span className="FileButton__description">{description}</span>
      )}
    </div>
  );
};
