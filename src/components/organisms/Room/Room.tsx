import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import { useFirebase } from "react-redux-firebase";
import Video from "twilio-video";
import LocalParticipant from "./LocalParticipant";
import Participant from "./Participant";
import "./Room.scss";
import { useUser } from "hooks/useUser";
import { useSelector } from "hooks/useSelector";
import { User } from "types/User";
import VideoErrorModal from "./VideoErrorModal";
import { partygoersSelectorData } from "utils/selectors";

interface RoomProps {
  roomName: string;
  venueName: string;
  setUserList: (val: User[]) => void;
  setParticipantCount?: (val: number) => void;
  setSeatedAtTable?: (val: string) => void;
  onBack?: () => void;
  hasChairs?: boolean;
  defaultMute?: boolean;
}

const Room: React.FC<RoomProps> = ({
  roomName,
  venueName,
  setUserList,
  setParticipantCount,
  setSeatedAtTable,
  hasChairs = true,
  defaultMute,
}) => {
  const [room, setRoom] = useState<Video.Room>();
  const [videoError, setVideoError] = useState<string>("");
  const [participants, setParticipants] = useState<Array<Video.Participant>>(
    []
  );

  const { user, profile } = useUser();
  const users = useSelector(partygoersSelectorData) ?? {};
  const [token, setToken] = useState<string>();
  const firebase = useFirebase();

  useEffect(
    () => setParticipantCount && setParticipantCount(participants.length),
    [participants.length, setParticipantCount]
  );

  useEffect(() => {
    (async () => {
      if (!user) return;

      // @ts-ignore
      const getToken = firebase.functions().httpsCallable("video-getToken");
      const response = await getToken({
        identity: user.uid,
        room: roomName,
      });
      setToken(response.data.token);
    })();
  }, [firebase, roomName, user]);

  const connectToVideoRoom = () => {
    if (!token) return;
    setVideoError("");

    Video.connect(token, {
      name: roomName,
    })
      .then((room) => {
        setRoom(room);
      })
      .catch((error) => setVideoError(error.message));
  };

  useEffect(() => {
    return () => {
      if (room && room.localParticipant.state === "connected") {
        room.localParticipant.tracks.forEach(function (trackPublication) {
          //@ts-ignored
          trackPublication.track.stop(); //@debt typing does this work?
        });
        room.disconnect();
      }
    };
  }, [room]);

  const leaveSeat = useCallback(async () => {
    if (!user || !profile) return;
    const doc = `users/${user.uid}`;
    const existingData = profile.data;
    const update = {
      data: {
        ...existingData,
        [venueName]: {
          table: null,
          videoRoom: null,
        },
      },
    };
    const firestore = firebase.firestore();
    await firestore
      .doc(doc)
      .update(update)
      .catch(() => {
        firestore.doc(doc).set(update);
      });
    setSeatedAtTable && setSeatedAtTable("");
  }, [firebase, profile, setSeatedAtTable, user, venueName]);

  useEffect(() => {
    if (!token) return;

    let localRoom: Video.Room;

    const participantConnected = (participant: Video.Participant) => {
      setParticipants((prevParticipants) => [
        // Hopefully prevents duplicate users in the participant list
        ...prevParticipants.filter((p) => p.identity !== participant.identity),
        participant,
      ]);
    };

    const participantDisconnected = (participant: Video.Participant) => {
      setParticipants((prevParticipants) => {
        if (!prevParticipants.find((p) => p === participant)) {
          // Remove when root issue foudn and fixed
          console.error("Could not find disconnnected participant:");
          console.error(participant);
        }
        return prevParticipants.filter((p) => p !== participant);
      });
    };

    Video.connect(token, {
      name: roomName,
    })
      .then((room) => {
        setRoom(room);
        localRoom = room;
        room.on("participantConnected", participantConnected);
        room.on("participantDisconnected", participantDisconnected);
        room.participants.forEach(participantConnected);
      })
      .catch((error) => setVideoError(error.message));

    return () => {
      if (localRoom && localRoom.localParticipant.state === "connected") {
        localRoom.localParticipant.tracks.forEach(function (trackPublication) {
          //@ts-ignored
          trackPublication.track.stop(); //@debt typing does this work?
        });
        localRoom.disconnect();
      }
    };
  }, [roomName, token, setParticipantCount]);

  useEffect(() => {
    if (!room) return;

    setUserList([
      ...participants.map((p) => users[p.identity]),
      users[room.localParticipant.identity],
    ]);
  }, [participants, setUserList, users, room]);

  // Ordering of participants:
  // 1. Me
  // 2. Bartender, if found (only one allowed)
  // 3. Rest of the participants, in order

  // Only allow the first bartender to appear as bartender
  const userIdentity = room?.localParticipant?.identity;
  const meIsBartender =
    users && userIdentity
      ? users[userIdentity]?.data?.[roomName]?.bartender
      : undefined;

  // Video stream and local participant take up 2 slots
  // Ensure capacity is always even, so the grid works

  const profileData = room ? users[room.localParticipant.identity] : undefined;

  const meComponent = useMemo(() => {
    return room && profileData ? (
      <div className="participant-container">
        <LocalParticipant
          key={room.localParticipant.sid}
          participant={room.localParticipant}
          profileData={profileData}
          profileDataId={room.localParticipant.identity}
          bartender={meIsBartender}
          defaultMute={defaultMute}
        />
      </div>
    ) : null;
  }, [meIsBartender, room, profileData, defaultMute]);

  const othersComponents = useMemo(
    () =>
      participants.map((participant, index) => {
        if (!participant) {
          return null;
        }

        const bartender = !!meIsBartender
          ? users[participant.identity]?.data?.[roomName]?.bartender
          : undefined;

        return (
          <div key={participant.identity} className="participant-container">
            <Participant
              key={`${participant.sid}-${index}`}
              participant={participant}
              profileData={users[participant.identity]}
              profileDataId={participant.identity}
              bartender={bartender}
            />
          </div>
        );
      }),
    [meIsBartender, participants, roomName, users]
  );

  const emptyComponents = useMemo(
    () =>
      hasChairs
        ? Array(participants.length % 2).map((e, index) => (
            <div
              key={`empty-participant-${index}`}
              className="participant-container"
            >
              <img
                className="empty-chair-image"
                src="/empty-chair.png"
                alt="empty chair"
              />
            </div>
          ))
        : [],
    [hasChairs, participants.length]
  );

  if (!token) {
    return <></>;
  }

  return (
    <Fragment>
      {meComponent}
      {othersComponents}
      {emptyComponents}
      <VideoErrorModal
        show={!!videoError}
        onHide={() => setVideoError("")}
        errorMessage={videoError}
        onRetry={connectToVideoRoom}
        onBack={() => (setSeatedAtTable ? leaveSeat() : setVideoError(""))}
      />
    </Fragment>
  );
};

export default Room;
