import React, { useState } from "react";
import { Sprite, useApp } from "@inlet/react-pixi";

import Viewport from "../Common/Viewport";
import { MAP_IMAGE } from "../../constants/Resources";
import {
  animateMapWorldBoundsSelector,
  animateMapZoomSelector,
} from "utils/selectors";
import { useSelector } from "hooks/useSelector";
import { LayerLOD } from "../LayerLOD/LayerLOD";
import { MovedEventData, ZoomedEventData } from "pixi-viewport";
import { setAnimateMapZoom } from "store/actions/AnimateMap";
import { useDispatch } from "hooks/useDispatch";
import { Box } from "js-quadtree";

const сameraRectMultiplier = 1.2;

export const MapContainer = () => {
  const worldBounds = useSelector(animateMapWorldBoundsSelector);
  const dispatch = useDispatch();
  const app = useApp();
  const LOD = useSelector(animateMapZoomSelector);

  const zoomedHandler = (data: ZoomedEventData) => {
    if (data.viewport.lastViewport.scaleY > 0.6 && LOD !== 0) {
      dispatch(setAnimateMapZoom(0));
    } else if (data.viewport.lastViewport.scaleY < 0.2 && LOD !== 2) {
      dispatch(setAnimateMapZoom(2));
    } else if (LOD !== 1) {
      dispatch(setAnimateMapZoom(1));
    }
  };

  const [cameraRect, setCameraRect] = useState(new Box(3000, 3000, 6000, 6000));
  const movedHandler = (data: MovedEventData) => {
    const view = data.viewport.lastViewport;
    const x = -view?.x / view?.scaleX;
    const y = -view?.y / view?.scaleY;
    const width = data.viewport.screenWidth / view?.scaleX;
    const height = data.viewport.screenHeight / view?.scaleY;
    setCameraRect(
      new Box(
        x + (width - width * сameraRectMultiplier) / 2,
        y + (height - height * сameraRectMultiplier) / 2,
        width * сameraRectMultiplier,
        height * сameraRectMultiplier
      )
    );
  };

  return (
    <Viewport
      worldWidth={worldBounds.width}
      worldHeight={worldBounds.height}
      interaction={app.renderer.plugins.interaction}
      zoomedHandler={zoomedHandler}
      movedHandler={movedHandler}
    >
      <Sprite image={MAP_IMAGE} />
      <LayerLOD key={"LayerLOD_1"} LOD={0} cameraRect={cameraRect}></LayerLOD>
      <LayerLOD key={"LayerLOD_2"} LOD={1} cameraRect={cameraRect}></LayerLOD>
      <LayerLOD key={"LayerLOD_3"} LOD={2} cameraRect={cameraRect}></LayerLOD>
    </Viewport>
  );
};
