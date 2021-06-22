import {
  ReplicatedUser,
  ReplicatedUserData,
  ReplicatedVenue,
  ReplicatedVenueData,
} from "store/reducers/AnimateMap";
import { Graphics, Sprite } from "@inlet/react-pixi";
import React from "react";

export const getVenuesForRender = (
  LOD: number,
  points: ReplicatedVenue[] | null
) => {
  if (!points?.length) return null;

  const items = [];
  switch (LOD) {
    case 0:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedVenueData;
        items.push(
          <Sprite
            key={"venue1_" + i}
            x={point.x}
            y={point.y}
            scale={1}
            image={data.imageUrlString}
          />
        );
      });
      if (!items.length) items.push(null);
      return items;

    case 1:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedVenueData;
        items.push(
          <Sprite
            key={"venue2_" + i}
            x={point.x}
            y={point.y}
            scale={0.8}
            image={data.imageUrlString}
          />
        );
      });
      if (!items.length) items.push(null);
      return items;

    case 2:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedVenueData;
        items.push(
          <Sprite
            key={"venue3_" + i}
            x={point.x}
            y={point.y}
            scale={0.6}
            image={data.imageUrlString}
          />
        );
      });
      if (!items.length) items.push(null);
      return items;
  }
};
export const getUsersForRender = (
  LOD: number,
  points: ReplicatedUser[] | null
) => {
  if (!points?.length) return null;

  const items = [];
  switch (LOD) {
    case 0:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedUserData;
        items.push(
          <Sprite
            key={"user1_" + i}
            x={point.x}
            y={point.y}
            scale={1}
            image={data.videoUrlString}
          />
        );
      });
      if (!items.length) items.push(null);
      return items;

    case 1:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedUserData;
        items.push(
          <Sprite
            key={"user2_" + i}
            x={point.x}
            y={point.y}
            scale={0.8}
            image={data.avatarUrlString}
          />
        );
      });
      if (!items.length) items.push(null);
      return items;

    case 2:
      points.forEach((point, i) => {
        const data = point.data as ReplicatedUserData;
        const draw = (g: PIXI.Graphics) => {
          g.clear();
          g.beginFill(data.dotColor);
          g.drawCircle(point.x, point.y, 20);
          g.endFill();
        };
        items.push(<Graphics key={"user3_" + i} draw={draw} />);
      });
      if (!items.length) items.push(null);
      return items;
  }
};
