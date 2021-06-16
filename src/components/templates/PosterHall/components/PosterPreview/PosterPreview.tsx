import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { useHistory } from "react-router-dom";

import { PosterPageVenue } from "types/venues";

import { WithId } from "utils/id";
import { enterVenue, externalUrlAdditionalProps } from "utils/url";

import { useWorldUsers, useRecentLocationUsers } from "hooks/users";

import { PosterBookmark } from "components/molecules/PosterBookmark";
import { UserProfilePicture } from "components/molecules/UserProfilePicture";

import { PosterCategory } from "components/atoms/PosterCategory";

import "./PosterPreview.scss";

import { POSTERPAGE_MORE_INFO_URL_TITLE } from "settings";

export interface PosterPreviewProps {
  posterVenue: WithId<PosterPageVenue>;
  canBeBookmarked?: boolean;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterVenue,
  canBeBookmarked = false,
}) => {
  const {
    title,
    authorName,
    categories,
    authors,
    posterId,
    moreInfoUrl,
    moreInfoUrls,
    moreInfoUrlTitle = POSTERPAGE_MORE_INFO_URL_TITLE,
    contactEmail,
  } = posterVenue.poster ?? {};

  const venueId = posterVenue.id;

  const posterClassnames = classNames("PosterPreview", {
    "PosterPreview--live": posterVenue.isLive,
  });

  const posterBookmarkClassname = "PosterPreview__bookmark";

  const { push: openUrlUsingRouter } = useHistory();

  const handleEnterVenue = useCallback(
    (e) => {
      if (
        e.target.closest([
          `.${posterBookmarkClassname}`,
          ".PosterPreview__posterId",
          ".PosterPreview__info",
          ".PosterPreview__moreInfoUrl",
          ".PosterPreview__avatar",
        ])
      )
        return;

      enterVenue(venueId, { customOpenRelativeUrl: openUrlUsingRouter });
    },
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

  const renderInfoLink = useCallback(
    (url: string, text: string) => (
      <a href={url} {...externalUrlAdditionalProps}>
        {text}
      </a>
    ),
    []
  );

  const moreUrlInfoText = posterId ?? moreInfoUrlTitle;

  const renderMoreInfoUrl = useMemo(() => {
    if (!moreInfoUrl) return;

    return renderInfoLink(moreInfoUrl, moreUrlInfoText);
  }, [moreInfoUrl, renderInfoLink, moreUrlInfoText]);

  const renderMoreInfoUrls = useMemo(() => {
    if (!moreInfoUrls) return;

    return moreInfoUrls.map((infoUrl) => (
      <div key={infoUrl}>{renderInfoLink(infoUrl, moreUrlInfoText)}</div>
    ));
  }, [moreInfoUrls, renderInfoLink, moreUrlInfoText]);

  const hasMoreInfo = renderMoreInfoUrl || renderMoreInfoUrls;

  return (
    <div className={posterClassnames} onClick={handleEnterVenue}>
      <div className="PosterPreview__header">
        <div className="PosterPreview__info">
          {canBeBookmarked && (
            <div className={posterBookmarkClassname}>
              <PosterBookmark posterVenue={posterVenue} />
            </div>
          )}
          {posterId && (
            <div className="PosterPreview__posterId">{renderMoreInfoUrl}</div>
          )}
        </div>
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

        <span className="PosterPreview__author">
          {authorList ?? authorName}
        </span>
      </div>
    </div>
  );
};
