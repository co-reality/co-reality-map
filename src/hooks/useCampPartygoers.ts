import { useMemo, useState } from "react";

import { LOC_UPDATE_FREQ_MS } from "settings";
import { User } from "types/User";
import { WithId } from "utils/id";
import { partygoersSelector } from "utils/selectors";

import { useConnectPartyGoers } from "./useConnectPartyGoers";
import { useInterval } from "./useInterval";
import { useSelector } from "./useSelector";

/**
 * Hook to retrieve a list of partygoers who were in venueName
 * within lastSeenThreshold.
 *
 * @param venueName venueName to filter partygoers by
 */
export const useCampPartygoers = (venueName: string): WithId<User>[] => {
  useConnectPartyGoers();
  const partygoers = useSelector(partygoersSelector);

  const [lastSeenThresholdMs, setLastSeenThresholdMs] = useState(Date.now());

  useInterval(() => {
    setLastSeenThresholdMs((Date.now() - LOC_UPDATE_FREQ_MS * 2) / 1000);
  }, LOC_UPDATE_FREQ_MS);

  return useMemo(
    () =>
      partygoers?.filter(
        (partygoer) =>
          partygoer?.lastSeenIn?.[venueName] >
          lastSeenThresholdMs - LOC_UPDATE_FREQ_MS
      ) ?? [],
    [partygoers, venueName, lastSeenThresholdMs]
  );
};
