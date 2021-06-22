import React, { useMemo } from "react";
import { Container } from "@inlet/react-pixi";
import { useSelector } from "hooks/useSelector";
import {
  animateMapUsersQTSelector,
  animateMapVenuesQTSelector,
  animateMapZoomSelector,
} from "utils/selectors";
import { Box } from "js-quadtree";
import { ReplicatedUser, ReplicatedVenue } from "store/reducers/AnimateMap";
import { getUsersForRender, getVenuesForRender } from "./GetItemsForRender";

export interface LayerLODProps {
  LOD: number;
  cameraRect: Box;
}

export const LayerLOD: React.FC<LayerLODProps> = ({ LOD, cameraRect }) => {
  const zoom = useSelector(animateMapZoomSelector);
  const isVisible = zoom === LOD;

  const usersQT = useSelector(animateMapUsersQTSelector);
  const venuesQT = useSelector(animateMapVenuesQTSelector);
  const users = usersQT?.query(cameraRect);
  const venues = venuesQT?.query(cameraRect);
  const usersForRender = useMemo(
    () => getUsersForRender(LOD, users as ReplicatedUser[]),
    [LOD, users]
  );
  const venuesForRender = useMemo(
    () => getVenuesForRender(LOD, venues as ReplicatedVenue[]),
    [LOD, venues]
  );

  return (
    <Container interactive={isVisible} visible={isVisible}>
      {venuesForRender}
      {usersForRender}
    </Container>
  );
};
