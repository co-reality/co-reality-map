export enum VideoRoomRequestState {
  invited = "invited",
  declined = "declined",
  accepted = "accepted",
  expired = "expired",
}

export interface VideoRoomRequest {
  hostUserId: string;
  hostUserLocation?: string;
  invitedUserId: string;
  invitedUserLocation?: string;
  state: VideoRoomRequestState;
  createdAt: number;
}
