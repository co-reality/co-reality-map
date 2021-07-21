import { RoomData_v2 } from "types/rooms";

export interface MapPreviewProps {
  venueName: string;
  mapBackground?: string;
  rooms: RoomData_v2[];
  venueId: string;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  onRoomChange?: (rooms: RoomData_v2[]) => void;
}
