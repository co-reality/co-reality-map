import React from "react";
import { useAsyncFn } from "react-use";

import { updateVenue_v2 } from "api/admin";

import { useUser } from "hooks/useUser";
import { useFetchAssets } from "hooks/useFetchAssetImages";

import { FileButton } from "components/atoms/FileButton";

import "./BackgroundSelect.scss";

export interface BackgroundSelectProps {
  venueName: string;
  mapBackground?: string;
}

export const BackgroundSelect: React.FC<BackgroundSelectProps> = ({
  venueName,
  mapBackground,
}) => {
  const { user } = useUser();
  const {
    assets: mapBackgrounds,
    isLoading: isLoadingBackgrounds,
  } = useFetchAssets("mapBackgrounds");

  const [{ loading: isUploading }, uploadMapBackground] = useAsyncFn(
    async (url: string, file?: FileList) => {
      if (!user) return;

      const hasCustomBackground = !!(file && file.length);

      return await updateVenue_v2(
        {
          name: venueName,
          ...(hasCustomBackground && { mapBackgroundImageFile: file }),
          mapBackgroundImageUrl: url,
        },
        user
      );
    },
    [user, venueName]
  );

  const hasBackgrounds = !!mapBackgrounds.length && !isLoadingBackgrounds;

  return (
    <div className="BackgroundSelect">
      {!mapBackground && (
        <>
          <FileButton
            disabled={isUploading}
            title="Import a map background"
            description="Recommended size: 2000px / 1200px"
            onChange={uploadMapBackground}
          />

          <h3>Or choose a map</h3>
          {isLoadingBackgrounds && <div>Loading maps...</div>}

          <div className="BackgroundSelect__map-grid">
            {hasBackgrounds &&
              mapBackgrounds.map((mapBackground, index) => (
                <button
                  className="BackgroundSelect__map"
                  disabled={isUploading}
                  style={{ backgroundImage: `url(${mapBackground})` }}
                  key={index}
                  onClick={() => uploadMapBackground(mapBackground)}
                />
              ))}
          </div>
        </>
      )}

      {mapBackground && (
        <img width="100%" src={mapBackground} alt="Venue map background" />
      )}
    </div>
  );
};
