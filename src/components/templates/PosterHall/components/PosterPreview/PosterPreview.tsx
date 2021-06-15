import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { useHistory } from "react-router-dom";

import { PosterPageVenue } from "types/venues";

import { WithId } from "utils/id";
import { enterVenue } from "utils/url";

import { useWorldUsers, useRecentLocationUsers } from "hooks/users";

import { UserProfilePicture } from "components/molecules/UserProfilePicture";
import { PosterCategory } from "components/atoms/PosterCategory";

import "./PosterPreview.scss";

export interface PosterPreviewProps {
  posterVenue: WithId<PosterPageVenue>;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterVenue,
}) => {
  const {
    title,
    authorName,
    categories,
    authors,
    posterId,
    moreInfoUrl,
    moreInfoUrls,
    contactEmail,
  } = posterVenue.poster ?? {};

  const venueId = posterVenue.id;

  const posterClassnames = classNames("PosterPreview", {
    "PosterPreview--live": posterVenue.isLive,
  });

  const { push: openUrlUsingRouter } = useHistory();

  const handleEnterVenue = useCallback(
    () => enterVenue(venueId, { customOpenRelativeUrl: openUrlUsingRouter }),
    [venueId, openUrlUsingRouter]
  );

  const renderedCategories = useMemo(
    () =>
      Array.from(new Set(categories)).map((category) => (
        <PosterCategory key={category} category={category} active />
      )),
    [categories]
  );

  const authorList = authors?.join(", ");

  const { worldUsers } = useWorldUsers();

  const presenterUser = useMemo(
    () => worldUsers.find((user) => user.partyName === authorName),
    [worldUsers, authorName]
  );

  const { recentLocationUsers } = useRecentLocationUsers(posterVenue.name);

  const userCount = recentLocationUsers.length;
  const hasUsers = userCount > 0;
  const userCountText = `${userCount} ${
    userCount === 1 ? "current visitor" : "current visitors"
  }`;

  const renderMoreInfoUrl = useMemo(() => {
    if (!moreInfoUrl) return;

    return (
      <a href={moreInfoUrl} target="_blank" rel="noreferrer">
        {moreInfoUrl.replace(/(^\w+:|^)\/\//, "")}
      </a>
    );
  }, [moreInfoUrl]);

  const renderMoreInfoUrls = useMemo(() => {
    if (!moreInfoUrls) return;

    return moreInfoUrls.map((infoUrl) => (
      <div key={infoUrl}>
        <a href={infoUrl} target="_blank" rel="noreferrer">
          {infoUrl.replace(/(^\w+:|^)\/\//, "")}
        </a>
      </div>
    ));
  }, [moreInfoUrls]);

  const hasMoreInfo = renderMoreInfoUrl || renderMoreInfoUrls;

  return (
    <div className={posterClassnames} onClick={handleEnterVenue}>
      <div className="PosterPreview__header">
        {posterId && (
          <div className="PosterPreview__posterId">
            {renderMoreInfoUrl || posterId}
          </div>
        )}
        {hasUsers && (
          <div className="PosterPreview__visiting">{userCountText}</div>
        )}
      </div>

      <p className="PosterPreview__title">{title}</p>

      {!posterId && hasMoreInfo && (
        <p className="PosterPreview__moreInfoUrl">
          {renderMoreInfoUrl}
          {renderMoreInfoUrls}
        </p>
      )}

      {contactEmail && (
        <p className="PosterPreview__contactEmail">{contactEmail}</p>
      )}

      <div className="PosterPreview__categories">{renderedCategories}</div>

      <div className="PosterPreview__authorBox">
        {presenterUser && (
          <UserProfilePicture
            containerClassName="PosterPreview__avatar"
            user={presenterUser}
            showStatus
          />
        )}

        <p className="PosterPreview__author">{authorList ?? authorName}</p>
      </div>
    </div>
  );
};
