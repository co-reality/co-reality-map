import React from "react";
import { Link, LinkProps } from "react-router-dom";

import "./PrettyLink.scss";

interface PrettyLinkProps extends LinkProps {}

export const PrettyLink: React.FC<PrettyLinkProps> = (props) => {
  const title = `${props.to}`;
  const text = title.replace(/.*\/\//, "");
  return (
    <div className="PrettyLink PrettyLink__wrapper">
      <Link {...props}>
        <span className="PrettyLink PrettyLink__text" title={title}>
          {text}
        </span>
      </Link>
    </div>
  );
};
