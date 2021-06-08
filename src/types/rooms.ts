import { SoundConfigReference } from "./sounds";

export enum RoomType {
  unclickable = "UNCLICKABLE",
  mapFrame = "MAPFRAME",
  video = "VIDEO",
  pdf = "PDF",
}

// @debt We should end up with 1 canonical room type
export interface Room {
  type?: RoomType;
  zIndex?: number;
  title: string;
  subtitle: string;
  url: string;
  about: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  isEnabled: boolean;
  image_url: string;
  enterSound?: SoundConfigReference;
  // Legacy?
  attendanceBoost?: number;
  hideTitle?: boolean;
}

// @debt We should end up with 1 canonical room type
export interface RoomData_v2 {
  type?: RoomType;
  zIndex?: number;
  title?: string;
  subtitle?: string;
  url?: string;
  description?: string;
  x_percent?: number;
  y_percent?: number;
  width_percent?: number;
  height_percent?: number;
  isEnabled?: boolean;
  image_url?: string;
  enterSound?: SoundConfigReference;
  template?: string;
  roomIndex?: number;
}
