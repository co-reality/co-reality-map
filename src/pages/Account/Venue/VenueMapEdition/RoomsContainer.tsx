import React, { useMemo } from "react";

import { Room } from "types/rooms";
import { ExtractProps } from "types/utility";

import { Container, SubVenueIconMap } from "./Container";

export type RoomsContainerProps = Omit<
  ExtractProps<typeof Container>,
  "otherIcons"
> & {
  rooms: Room[];
  currentRoomIndex?: number;
};

export const RoomsContainer: React.FC<RoomsContainerProps> = ({
  currentRoomIndex,
  rooms,
  ...rest
}) => {
  // @debt Refactor Container component and figure out what 'otherIcons' is used for.
  const otherIcons: SubVenueIconMap = useMemo(() => {
    return (
      rooms
        ?.filter((r, index) => index !== currentRoomIndex)
        .reduce((acc, r) => {
          return {
            ...acc,
            [r.title]: {
              title: r.title,
              width: r.width_percent,
              height: r.height_percent,
              top: r.y_percent,
              left: r.x_percent,
              url: r.image_url,
            },
          };
        }, {}) ?? {}
    );
  }, [rooms, currentRoomIndex]);

  return <Container {...rest} otherIcons={otherIcons} />;
};
