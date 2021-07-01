import { videoRoomInvitesSelector } from "utils/selectors";
import { WithId } from "utils/id";

import { VideoRoomRequest, VideoRoomRequestState } from "types/videoRoom";

import { useFirestoreConnect } from "hooks/useFirestoreConnect";
import { useSelector } from "hooks/useSelector";

export const useConnectVideoRooms = (
  userId: string
): WithId<VideoRoomRequest>[] => {
  useFirestoreConnect([
    {
      collection: "videoRooms",
      where: [
        ["invitedUserId", "==", userId],
        ["state", "==", VideoRoomRequestState.invited],
      ],
      storeAs: "videoRoomInvites",
    },
  ]);

  const videoRoomInvites = useSelector(videoRoomInvitesSelector);

  return videoRoomInvites;
};
