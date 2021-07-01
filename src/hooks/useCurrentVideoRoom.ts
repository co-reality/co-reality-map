import { WithId } from "utils/id";
import {
  currentVideoRoomSelector,
  isCurrentVideoRoomRequestedSelector,
} from "utils/selectors";

import { VideoRoomRequest } from "types/videoRoom";

import { useFirestoreConnect } from "./useFirestoreConnect";
import { useSelector } from "./useSelector";
import { ReactHook } from "types/utility";

export type UseCurrentVideoRoomProps = string;

export interface UseCurrentVideoRoomReturn {
  videoRoom: WithId<VideoRoomRequest> | undefined;
}

export const useCurrentVideoRoom: ReactHook<
  UseCurrentVideoRoomProps,
  UseCurrentVideoRoomReturn
> = (videoRoomId: string) => {
  useFirestoreConnect([
    {
      collection: "videoRooms",
      doc: videoRoomId,
      storeAs: "currentVideoRoom",
    },
  ]);

  const currentVideoRoom = useSelector(currentVideoRoomSelector);
  const isLoadingCurrentVideoRoom = useSelector(
    isCurrentVideoRoomRequestedSelector
  );

  return {
    videoRoom: currentVideoRoom,
    isLoading: isLoadingCurrentVideoRoom,
  };
};
