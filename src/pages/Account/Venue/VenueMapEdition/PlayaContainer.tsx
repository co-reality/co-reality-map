import React, { useMemo } from "react";

import { useSelector } from "hooks/useSelector";
import { useFirestoreConnect } from "hooks/useFirestoreConnect";

import { Container, SubVenueIconMap } from "./Container";
import { ExtractProps } from "types/utility";
import { VenuePlacementState } from "types/venues";
import { PLAYA_HEIGHT, PLAYA_WIDTH } from "settings";

type PropsType = Omit<ExtractProps<typeof Container>, "otherIcons"> & {
  venueId?: string;
};

export const PlayaContainer: React.FC<PropsType> = (props) => {
  const { venueId, ...rest } = props;
  useFirestoreConnect({
    collection: "venues",
    where: [
      "placement.state",
      "in",
      [VenuePlacementState.SelfPlaced, VenuePlacementState.AdminPlaced],
    ],
    storeAs: "playaVenues",
  });

  const venues = useSelector((state) => state.firestore.ordered.playaVenues);

  const placedVenues: SubVenueIconMap = useMemo(() => {
    return (
      venues
        ?.filter((v) => v.placement?.x && v.placement?.y)
        .filter((v) => v.id !== venueId)
        .reduce((acc, v) => {
          return {
            ...acc,
            [v.id]: {
              width: v.width ? (v.width / PLAYA_WIDTH) * 100 : 2,
              height: v.height ? (v.height / PLAYA_HEIGHT) * 100 : 2,
              top: v.placement?.y,
              left: v.placement?.x,
            },
          };
        }, {}) ?? {}
    );
  }, [venues, venueId]);

  return <Container {...rest} otherIcons={placedVenues} />;
};
