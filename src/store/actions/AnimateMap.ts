import {
  AnimateMapStageOptions,
  ReplicatedUser,
  ReplicatedVenue,
} from "../reducers/AnimateMap";
import { ReduxAction } from "../../types/redux";

export enum AnimateMapActionTypes {
  UPDATE_STAGE_OPTIONS = "AnimateMapActionTypes.UPDATE_STAGE_OPTIONS",
  UPDATE_ZOOM = "AnimateMapActionTypes.UPDATE_ZOOM",
  UPDATE_USERS = "AnimateMapActionTypes.UPDATE_USERS",
  UPDATE_VENUES = "AnimateMapActionTypes.UPDATE_VENUES",
}

export type setAnimateMapStageOptionsAction = ReduxAction<
  AnimateMapActionTypes.UPDATE_STAGE_OPTIONS,
  {
    options: AnimateMapStageOptions;
  }
>;

export type setAnimateMapZoomAction = ReduxAction<
  AnimateMapActionTypes.UPDATE_ZOOM,
  {
    zoom: number;
  }
>;

export type updateAnimateMapUsersAction = ReduxAction<
  AnimateMapActionTypes.UPDATE_USERS,
  {
    users: Map<string, ReplicatedUser>;
  }
>;

export type updateAnimateMapVenuesAction = ReduxAction<
  AnimateMapActionTypes.UPDATE_VENUES,
  {
    venues: Map<string, ReplicatedVenue>;
  }
>;

export const setAnimateMapStageOptions = (
  options?: AnimateMapStageOptions
): setAnimateMapStageOptionsAction => ({
  type: AnimateMapActionTypes.UPDATE_STAGE_OPTIONS,
  payload: { options },
});

export const setAnimateMapZoom = (zoom: number): setAnimateMapZoomAction => ({
  type: AnimateMapActionTypes.UPDATE_ZOOM,
  payload: { zoom },
});

export const updateAnimateMapUsers = (
  users: Map<string, ReplicatedUser>
): updateAnimateMapUsersAction => ({
  type: AnimateMapActionTypes.UPDATE_USERS,
  payload: { users },
});

export const updateAnimateMapVenues = (
  venues: Map<string, ReplicatedVenue>
): updateAnimateMapVenuesAction => ({
  type: AnimateMapActionTypes.UPDATE_VENUES,
  payload: { venues },
});

export type AnimateMapActions =
  | setAnimateMapStageOptionsAction
  | setAnimateMapZoomAction
  | updateAnimateMapUsersAction
  | updateAnimateMapVenuesAction;
