import { useCallback, useMemo } from "react";

import { setGridData } from "api/profile";

import {
  SECTION_DEFAULT_COLUMNS_COUNT,
  SECTION_DEFAULT_ROWS_COUNT,
  REACTIONS_CONTAINER_HEIGHT_IN_SEATS,
} from "settings";

import { GridPosition } from "types/grid";
import { AuditoriumVenue } from "types/venues";

import {
  convertToCartesianCoordinate,
  getAuditoriumSeatedUsers,
  getVideoSizeInSeats,
} from "utils/auditorium";
import { currentAuditoriumSectionsByIdSelector } from "utils/selectors";
import { WithId } from "utils/id";

import { useSelector } from "../useSelector";
import { isLoaded } from "../useFirestoreConnect";
import { useRecentVenueUsers } from "../users";
import { useUser, useUserInvalidateCache } from "../useUser";
import { useGetUserByPosition } from "../useGetUserByPosition";

import { useConnectAllAuditoriumSections } from "./useAllAuditoriumSections";

export interface UseAuditoriumSectionProps {
  venue: WithId<AuditoriumVenue>;
  sectionId?: string;
}

export const useAuditoriumSection = ({
  venue,
  sectionId,
}: UseAuditoriumSectionProps) => {
  const {
    id: venueId,
    name: venueName,
    auditoriumColumns: venueColumnsCount,
    auditoriumRows: venueRowsCount,
  } = venue;

  useConnectAllAuditoriumSections(venueId);

  const { userWithId } = useUser();
  const userId = userWithId?.id;

  const { recentVenueUsers } = useRecentVenueUsers({ venueName });

  const sectionsById = useSelector(currentAuditoriumSectionsByIdSelector);
  const section = sectionId ? sectionsById?.[sectionId] : undefined;

  const baseRowsCount =
    section?.rowsCount ?? venueRowsCount ?? SECTION_DEFAULT_ROWS_COUNT;
  const baseColumnsCount =
    section?.columnsCount ?? venueColumnsCount ?? SECTION_DEFAULT_COLUMNS_COUNT;

  const { videoHeightInSeats, videoWidthInSeats } = getVideoSizeInSeats(
    baseColumnsCount
  );

  const screenHeightInSeats =
    videoHeightInSeats + REACTIONS_CONTAINER_HEIGHT_IN_SEATS;
  const screenWidthInSeats = videoWidthInSeats;

  const seatedUsers = getAuditoriumSeatedUsers({
    auditoriumUsers: recentVenueUsers,
    venueId,
    sectionId,
  });

  const isUserSeated = useMemo(
    () => seatedUsers.some((seatedUser) => seatedUser.id === userId),
    [seatedUsers, userId]
  );

  const getUserBySeat = useGetUserByPosition({
    venueId,
    positionedUsers: seatedUsers,
  });

  const { invalidateUserCache } = useUserInvalidateCache(userId);

  const takeSeat: (
    gridPosition: GridPosition
  ) => Promise<void> | undefined = useCallback(
    ({ row, column }: GridPosition) => {
      if (!sectionId || !venueId || !userId) return;

      return setGridData({
        venueId,
        userId,
        gridData: { sectionId, row, column },
      }).then(() => invalidateUserCache());
    },
    [sectionId, venueId, userId, invalidateUserCache]
  );

  const leaveSeat: () => Promise<void> | undefined = useCallback(() => {
    if (!venueId || !userId) return;

    return setGridData({ venueId, userId, gridData: undefined });
  }, [venueId, userId]);

  const checkIfSeat = useCallback(
    ({ row, column }: GridPosition) => {
      const covertedRowCoordinate = convertToCartesianCoordinate({
        index: row,
        totalAmount: baseRowsCount,
      });
      const convertedColumnCoordinate = convertToCartesianCoordinate({
        index: column,
        totalAmount: baseColumnsCount,
      });

      const isInVideoRow =
        Math.abs(covertedRowCoordinate) <= screenHeightInSeats / 2;
      const isInVideoColumn =
        Math.abs(convertedColumnCoordinate) <= screenWidthInSeats / 2;

      return !(isInVideoRow && isInVideoColumn);
    },
    [baseRowsCount, baseColumnsCount, screenHeightInSeats, screenWidthInSeats]
  );

  return {
    auditoriumSection: section,
    isAuditoriumSectionLoaded: isLoaded(sectionsById),

    baseRowsCount,
    baseColumnsCount,

    screenWidthInSeats,
    screenHeightInSeats,

    isUserSeated,

    getUserBySeat,
    takeSeat,
    leaveSeat,
    checkIfSeat,
  };
};
