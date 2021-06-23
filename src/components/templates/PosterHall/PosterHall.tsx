import React, { useMemo } from "react";

import { GenericVenue } from "types/venues";

import { WithId } from "utils/id";

import { usePosters, useLiveEventNonPosterSubVenues } from "hooks/posters";

import { Button } from "components/atoms/Button";
import { PosterCategory } from "components/atoms/PosterCategory";

import { PosterPreview } from "./components/PosterPreview";
import { NonPosterSubVenuePreview } from "./components/NonPosterSubVenuePreview";
import { PosterHallSearch } from "./components/PosterHallSearch";

import "./PosterHall.scss";

export interface PosterHallProps {
  venue: WithId<GenericVenue>;
}

export const PosterHall: React.FC<PosterHallProps> = ({ venue }) => {
  const {
    posterVenues,
    isPostersLoaded,
    hasHiddenPosters,

    increaseDisplayedPosterCount,

    categoryList,
    subCategoryList,

    searchInputValue,
    liveFilter,

    bookmarkedFilter,
    setBookmarkedFilter,
    categoryFilter,
    subCategoryFilter,

    setSearchInputValue,
    setLiveFilter,
    setCategoryFilter,
    setSubCategoryFilter,
    unsetCategoryFilter,
  } = usePosters(venue.id);

  const shouldShowMorePosters = isPostersLoaded && hasHiddenPosters;

  const renderedPosterPreviews = useMemo(() => {
    return posterVenues.map((posterVenue) => (
      <PosterPreview
        key={posterVenue.id}
        posterVenue={posterVenue}
        canBeBookmarked={venue?.canBeBookmarked}
      />
    ));
  }, [posterVenues, venue]);

  const { liveNonPosterSubVenueEvents } = useLiveEventNonPosterSubVenues(
    venue.id
  );

  const renderedNonPosterSubVenues = useMemo(() => {
    if (!liveNonPosterSubVenueEvents) return;

    return liveNonPosterSubVenueEvents.map((nonPosterSubVenueEvent, index) => (
      <NonPosterSubVenuePreview
        key={`${nonPosterSubVenueEvent.venueId}-${index}`}
        venueId={nonPosterSubVenueEvent.venueId}
        title={nonPosterSubVenueEvent.name}
        host={nonPosterSubVenueEvent.host}
      />
    ));
  }, [liveNonPosterSubVenueEvents]);

  const renderedCategoryOptions = useMemo(
    () => (
      <div className="PosterHall__categories">
        <PosterCategory
          key="All posters"
          category="All posters"
          onClick={unsetCategoryFilter}
          containerClassname="PosterHall__category"
          active={categoryFilter === undefined}
        />
        {categoryList.map((category) => {
          if (!category) return [];
          return (
            <PosterCategory
              key={category}
              category={category}
              onClick={() => setCategoryFilter(category)}
              containerClassname="PosterHall__category"
              active={category === categoryFilter}
            />
          );
        })}
      </div>
    ),
    [categoryList, categoryFilter, setCategoryFilter, unsetCategoryFilter]
  );

  const renderedSubCategoryOptions = useMemo(
    () => (
      <div className="PosterHall__subcategories">
        {subCategoryList.map((subCategory) => (
          <PosterCategory
            key={subCategory}
            category={subCategory}
            onClick={() => setSubCategoryFilter(subCategory)}
            containerClassname="PosterHall__subcategory"
            active={subCategory === subCategoryFilter}
          />
        ))}
      </div>
    ),
    [subCategoryList, subCategoryFilter, setSubCategoryFilter]
  );

  const showCategoriesFilter = useMemo(
    () => venue?.showCategoriesFilter ?? false,
    [venue]
  );

  return (
    <div className="PosterHall">
      <div className="PosterHall__related">{renderedNonPosterSubVenues}</div>

      <div className="PosterHall__header">
        {venue.leftLogo && (
          <img
            src={venue.leftLogo}
            className="PosterHall__sponsor-logo"
            alt="poster hall left logo"
          />
        )}
        <PosterHallSearch
          setSearchInputValue={setSearchInputValue}
          searchInputValue={searchInputValue}
          liveFilterValue={liveFilter}
          setLiveValue={setLiveFilter}
          bookmarkedFilterValue={bookmarkedFilter}
          setBookmarkedValue={setBookmarkedFilter}
          showBookmarks={venue?.canBeBookmarked}
        />
        {venue.rightLogo && (
          <img
            src={venue.rightLogo}
            className="PosterHall__sponsor-logo"
            alt="poster hall right logo"
          />
        )}
      </div>

      {showCategoriesFilter ? renderedCategoryOptions : null}
      {showCategoriesFilter ? renderedSubCategoryOptions : null}

      <div className="PosterHall__posters">
        {isPostersLoaded ? renderedPosterPreviews : "Loading posters"}
      </div>

      <div className="PosterHall__more-button">
        {shouldShowMorePosters && (
          <Button onClick={increaseDisplayedPosterCount}>
            Show more posters
          </Button>
        )}
      </div>
    </div>
  );
};
