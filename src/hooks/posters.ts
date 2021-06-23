import { useState, useMemo, useCallback, useEffect } from "react";

import Fuse from "fuse.js";

import { VenueEvent, VenueTemplate } from "types/venues";

import { tokeniseStringWithQuotesBySpaces } from "utils/text";
import { posterVenuesSelector } from "utils/selectors";
import { isEventLive } from "utils/event";
import { WithVenueId } from "utils/id";
import { isTruthy } from "utils/types";

import { isLoaded, useFirestoreConnect } from "./useFirestoreConnect";
import { useSelector } from "./useSelector";
import { useDebounceSearch } from "./useDebounceSearch";
import { useRelatedVenues } from "./useRelatedVenues";
import { useVenueEvents } from "./events";
import { useInterval } from "./useInterval";

import {
  DEFAULT_DISPLAYED_POSTER_PREVIEW_COUNT,
  POSTERHALL_SUBVENUE_STATUS_MS,
} from "settings";

import { useUser } from "hooks/useUser";

export const emptySavedPosters = {};

export const useConnectPosterVenues = (posterHallId: string) => {
  useFirestoreConnect(() => {
    return [
      {
        collection: "venues",
        where: [
          ["template", "==", VenueTemplate.posterpage],
          ["parentId", "==", posterHallId],
        ],
        storeAs: "posterVenues",
      },
    ];
  });
};

export const usePosterVenues = (posterHallId: string) => {
  useConnectPosterVenues(posterHallId);

  const posterVenues = useSelector(posterVenuesSelector);

  return useMemo(
    () => ({
      posterVenues: posterVenues ?? [],
      isPostersLoaded: isLoaded(posterVenues),
    }),
    [posterVenues]
  );
};

export const usePosters = (posterHallId: string) => {
  const { posterVenues, isPostersLoaded } = usePosterVenues(posterHallId);

  const {
    searchInputValue,
    searchQuery,
    setSearchInputValue,
  } = useDebounceSearch();

  const [categoryFilter, _setCategoryFilter] = useState<string>();
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>();
  const [liveFilter, setLiveFilter] = useState<boolean>(false);
  const [bookmarkedFilter, setBookmarkedFilter] = useState<boolean>(false);
  const [displayedPostersCount, setDisplayedPostersAmount] = useState(
    DEFAULT_DISPLAYED_POSTER_PREVIEW_COUNT
  );
  const { userWithId } = useUser();
  const userPosterIds = userWithId?.savedPosters ?? emptySavedPosters;

  const setCategoryFilter = useCallback((category: string) => {
    // Clear previously chosen subcategory
    setSubCategoryFilter(undefined);
    _setCategoryFilter(category);
  }, []);

  const unsetCategoryFilter = useCallback(() => {
    // Clear chosen subcategory, if any
    setSubCategoryFilter(undefined);
    _setCategoryFilter(undefined);
  }, []);

  const increaseDisplayedPosterCount = useCallback(() => {
    setDisplayedPostersAmount(
      (prevPostersNumber) =>
        prevPostersNumber + DEFAULT_DISPLAYED_POSTER_PREVIEW_COUNT
    );
  }, []);

  const categoryList = useMemo(() => {
    const liveFilterResultsCategory = liveFilter
      ? posterVenues.filter((posterVenue) => posterVenue.isLive)
      : posterVenues;
    const bookmarkedFilterResultsCategory = bookmarkedFilter
      ? liveFilterResultsCategory.filter(
          (posterVenue) =>
            //@ts-ignore
            userPosterIds[posterVenue.id]?.[0] === posterVenue.id
        )
      : liveFilterResultsCategory;
    return Array.from(
      new Set(
        bookmarkedFilterResultsCategory
          .map((posterVenue) => posterVenue.poster?.categories)
          .flat()
      )
    );
  }, [liveFilter, posterVenues, bookmarkedFilter, userPosterIds]);

  const filteredPostersByCategory = useMemo(
    () =>
      categoryFilter
        ? posterVenues.filter((posterVenue) =>
            posterVenue.poster?.categories.includes(categoryFilter)
          )
        : posterVenues,
    [posterVenues, categoryFilter]
  );

  const subCategoryList = useMemo(() => {
    const liveFilterResultsSubCategory = liveFilter
      ? filteredPostersByCategory.filter((posterVenue) => posterVenue.isLive)
      : filteredPostersByCategory;
    const bookmarkedFilterResultsSubCategory = bookmarkedFilter
      ? liveFilterResultsSubCategory.filter(
          (posterVenue) =>
            //@ts-ignore
            userPosterIds[posterVenue.id]?.[0] === posterVenue.id
        )
      : liveFilterResultsSubCategory;
    return categoryFilter
      ? Array.from(
          new Set(
            bookmarkedFilterResultsSubCategory
              .map((posterVenue) => posterVenue.poster?.subcategories)
              .flat()
              .filter((subcategory) =>
                subcategory?.category.includes(categoryFilter)
              )
              .map((subcategory) => subcategory?.subcategory)
              .flat()
          )
        ).filter(isTruthy)
      : [];
  }, [
    liveFilter,
    filteredPostersByCategory,
    bookmarkedFilter,
    categoryFilter,
    userPosterIds,
  ]);

  const filteredPostersBySubCategory = useMemo(
    () =>
      subCategoryFilter
        ? filteredPostersByCategory.filter((posterVenue) =>
            posterVenue.poster?.subcategories
              ?.map((subcategory) => subcategory?.subcategory)
              .includes(subCategoryFilter)
          )
        : filteredPostersByCategory,
    [filteredPostersByCategory, subCategoryFilter]
  );

  const liveFilteredPosterVenues = useMemo(
    () =>
      liveFilter
        ? filteredPostersBySubCategory.filter(
            (filteredPostersBySubCategory) =>
              filteredPostersBySubCategory.isLive
          )
        : filteredPostersBySubCategory,
    [filteredPostersBySubCategory, liveFilter]
  );

  const filteredPosterVenues = useMemo(
    () =>
      bookmarkedFilter
        ? liveFilteredPosterVenues.filter(
            (posterVenue) =>
              //@ts-ignore
              userPosterIds[posterVenue.id]?.[0] === posterVenue.id
          )
        : liveFilteredPosterVenues,
    [liveFilteredPosterVenues, bookmarkedFilter, userPosterIds]
  );

  // See https://fusejs.io/api/options.html
  const fuseVenues = useMemo(
    () =>
      new Fuse(filteredPosterVenues, {
        keys: [
          "name",
          {
            name: "poster.title",
            weight: 20,
          },
          {
            name: "poster.authorName",
            weight: 16,
          },
          "poster.categories",
          {
            name: "poster.authors",
            weight: 8,
          },
          "poster.keywords",
          "poster.introduction",
        ],
        threshold: 0.2, // 0.1 seems to be exact, default 0.6: brings too distant if anyhow related hits
        ignoreLocation: true, // default False: True - to search ignoring location of the words.
        findAllMatches: true,
      }),
    [filteredPosterVenues]
  );

  const searchedPosterVenues = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim();

    if (!normalizedSearchQuery) return filteredPosterVenues;

    const tokenisedSearchQuery = tokeniseStringWithQuotesBySpaces(
      normalizedSearchQuery
    );

    if (tokenisedSearchQuery.length === 0) return filteredPosterVenues;

    return fuseVenues
      .search({
        $and: tokenisedSearchQuery.map((searchToken: string) => {
          const orFields: Fuse.Expression[] = [
            { name: searchToken },
            { "poster.title": searchToken },
            { "poster.authorName": searchToken },
            { "poster.categories": searchToken },
            { "poster.authors": searchToken },
            { "poster.keywords": searchToken },
            { "poster.introduction": searchToken },
          ];

          return {
            $or: orFields,
          };
        }),
      })
      .map((fuseResult) => fuseResult.item);
  }, [searchQuery, fuseVenues, filteredPosterVenues]);

  const displayedPosterVenues = useMemo(
    () => searchedPosterVenues.slice(0, displayedPostersCount),
    [searchedPosterVenues, displayedPostersCount]
  );

  const hasHiddenPosters =
    searchedPosterVenues.length > displayedPosterVenues.length;

  return {
    posterVenues: displayedPosterVenues,
    isPostersLoaded,
    hasHiddenPosters,

    categoryList,
    subCategoryList,

    searchInputValue,
    categoryFilter,
    subCategoryFilter,
    liveFilter,
    bookmarkedFilter,

    increaseDisplayedPosterCount,
    setSearchInputValue,
    setLiveFilter,
    setBookmarkedFilter,
    setCategoryFilter,
    setSubCategoryFilter,
    unsetCategoryFilter,
  };
};

export const filterLiveEvents = (
  nonPosterSubVenueEvents: WithVenueId<VenueEvent>[]
) => nonPosterSubVenueEvents.filter((event) => isEventLive(event));

export const useLiveEventNonPosterSubVenues = (posterHallId: string) => {
  const { relatedVenues } = useRelatedVenues({
    currentVenueId: posterHallId,
  });

  const nonPosterSubVenueIds = useMemo(
    () =>
      relatedVenues
        .filter(
          (relatedVenue) =>
            relatedVenue.parentId === posterHallId &&
            relatedVenue.template !== VenueTemplate.posterpage
        )
        .map((venue) => venue.id),
    [relatedVenues, posterHallId]
  );

  const { events: nonPosterSubVenueEvents, isEventsLoading } = useVenueEvents({
    venueIds: nonPosterSubVenueIds,
  });

  const [
    liveNonPosterSubVenueEvents,
    setLiveNonPosterSubVenueEvents,
  ] = useState<WithVenueId<VenueEvent>[]>();

  const updateLiveEvents = useCallback(() => {
    if (isEventsLoading) return;

    const filteredLiveEvents = filterLiveEvents(nonPosterSubVenueEvents);

    setLiveNonPosterSubVenueEvents(filteredLiveEvents);
  }, [nonPosterSubVenueEvents, isEventsLoading]);

  useEffect(() => updateLiveEvents(), [updateLiveEvents]);

  useInterval(() => {
    updateLiveEvents();
  }, POSTERHALL_SUBVENUE_STATUS_MS);

  return {
    liveNonPosterSubVenueEvents,
  };
};
