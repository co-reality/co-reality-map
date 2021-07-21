import { useEffect, useRef } from "react";

import { isDefined } from "utils/types";

export interface PreloadAsset {
  url: string;
  as?: string;
  type?: string;
}

const createLinkElement = ({ url, type, as = "image" }: PreloadAsset) => {
  const link: HTMLLinkElement = document.createElement("link");

  link.rel = "preload";
  link.as = as;
  link.href = url;

  if (isDefined(type)) {
    link.type = type;
  }

  return link;
};

export const usePreloadAssets = (assets: PreloadAsset[]) => {
  const headRef = useRef<HTMLHeadElement>(document.head);

  useEffect(() => {
    const links = assets.map((asset) => {
      const link = createLinkElement(asset);
      headRef.current.appendChild(link);
      return link;
    });

    return () => {
      for (const link of links) {
        link.remove();
      }
    };
  }, [assets]);
};
