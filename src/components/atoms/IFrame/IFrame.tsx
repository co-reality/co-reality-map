import React from "react";

import { IFRAME_ALLOW } from "settings";

export interface IFrameProps {
  containerClassname?: string;
  iframeClassname?: string;
  iframeStyles?: React.CSSProperties;
  src?: string;
  title?: string;
}

export const IFrame: React.FC<IFrameProps> = ({
  src,
  containerClassname,
  iframeClassname,
  iframeStyles,
  title = "iframe",
}) => (
  <div className={containerClassname}>
    <iframe
      className={iframeClassname}
      style={iframeStyles}
      src={src}
      title={title}
      frameBorder="0"
      allow={IFRAME_ALLOW}
      allowFullScreen
    />
  </div>
);
