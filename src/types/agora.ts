import {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";

export enum AgoraClientConnectionState {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  RECONNECTING = "RECONNECTING",
  DISCONNECTING = "DISCONNECTING",
}

export interface UseAgoraRemotesProps {
  client: IAgoraRTCClient;
}
export type UseAgoraRemotesReturn = IAgoraRTCRemoteUser[];

export interface UseAgoraScreenShareProps {
  client: IAgoraRTCClient;
}
export interface UseAgoraScreenShareReturn {
  localScreenTrack?: ILocalVideoTrack;
  stopShare(): void;
  shareScreen(): Promise<void>;
  joinChannel(): Promise<void>;
  leaveChannel(): Promise<void>;
}

export interface UseAgoraCameraProps {
  client: IAgoraRTCClient;
}
export interface UseAgoraCameraReturn {
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  localCameraTrack?: ILocalVideoTrack;
  toggleCamera(): void;
  toggleMicrophone(): void;
  joinChannel(): Promise<void>;
  leaveChannel(): Promise<void>;
}
