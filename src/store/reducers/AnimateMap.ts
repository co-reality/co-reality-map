import {
  AnimateMapActions,
  AnimateMapActionTypes,
} from "../actions/AnimateMap";
import { Reducer } from "redux";
import { Box, QuadTree } from "js-quadtree";

//Note: maybe relocate to src/types/AnimateMapVenue in the future
// Gets the length of an array/tuple type.
// see: https://dev.to/kjleitz/comment/gb5d
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LengthOfTuple<T extends any[]> = T extends { length: infer L } ? L : never;

// Drops the first element of a tuple.
// see: https://dev.to/kjleitz/comment/gb5d
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DropFirstInTuple<T extends any[]> = T extends [arg: any, ...rest: infer U]
  ? U
  : T;

// Gets the type of the last element of a tuple.
// see: https://dev.to/kjleitz/comment/gb5d
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LastInTuple<T extends any[]> = T[LengthOfTuple<DropFirstInTuple<T>>];

export type AnimateMapStageOptions = LastInTuple<
  ConstructorParameters<typeof PIXI.Application>
>;

export type AnimateMapWorldBounds = { width: number; height: number };

export interface AnimateMapPoint {
  x: number; //integer
  y: number; //integer
}

export interface ReplicatedUserData {
  id: string;
  videoUrlString: string;
  avatarUrlString: string;
  dotColor: number; //hex
}

export interface ReplicatedUser extends AnimateMapPoint {
  data: ReplicatedUserData;
}

export interface ReplicatedVenueData {
  id: string;
  videoUrlString: string;
  imageUrlString: string;
}

export interface ReplicatedVenue extends AnimateMapPoint {
  data: ReplicatedVenueData;
}

interface AnimateMapState {
  stageOptions: AnimateMapStageOptions;
  worldWidth: number;
  worldHeight: number;
  zoom: number;
  users: Map<string, ReplicatedUser>;
  usersQT: QuadTree | null;
  venues: Map<string, ReplicatedVenue>;
  venuesQT: QuadTree | null;
}

const initialAnimateMapState: AnimateMapState = {
  stageOptions: {
    backgroundColor: 0x10bb99,
    antialias: true,
    autoDensity: true,
    resizeTo: undefined,
  },
  worldWidth: 9920,
  worldHeight: 9920,
  zoom: 5,
  users: new Map<string, ReplicatedUser>(),
  usersQT: null,
  venues: new Map<string, ReplicatedVenue>(),
  venuesQT: null,
};

export type AnimateMapReducer = Reducer<AnimateMapState, AnimateMapActions>;

function generateNewQuadtree(
  items: Map<string, ReplicatedVenue | ReplicatedUser>,
  quadTree: QuadTree | null,
  state: AnimateMapState
): QuadTree {
  if (!quadTree) {
    // create tree
    quadTree = new QuadTree(
      new Box(0, 0, state.worldWidth, state.worldHeight),
      { maximumDepth: 100 },
      Array.from(items).map(([key, value]) => value)
    );
    return quadTree;
  } else {
    // update tree
    quadTree.clear(); //NOTE: can optimize if we will remove certain elements before update
    quadTree.insert(Array.from(items).map(([key, value]) => value));
    return quadTree;
  }
}

export const animateMapReducer: AnimateMapReducer = (
  state = initialAnimateMapState,
  action: AnimateMapActions
): AnimateMapState => {
  switch (action.type) {
    case AnimateMapActionTypes.UPDATE_STAGE_OPTIONS:
      const { options } = action.payload;
      return { ...state, stageOptions: options };

    case AnimateMapActionTypes.UPDATE_ZOOM:
      const { zoom } = action.payload;
      return { ...state, zoom: zoom };

    case AnimateMapActionTypes.UPDATE_USERS:
      const { users } = action.payload;
      const usersQT = generateNewQuadtree(users, state.usersQT, state);
      return { ...state, users: users, usersQT: usersQT };

    case AnimateMapActionTypes.UPDATE_VENUES:
      const { venues } = action.payload;
      const venuesQT = generateNewQuadtree(venues, state.venuesQT, state);
      return { ...state, venues: venues, venuesQT: venuesQT };

    default:
      return state;
  }
};
