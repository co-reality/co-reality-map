import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import { useFirebase } from "react-redux-firebase";
import Bugsnag from "@bugsnag/js";
import Video from "twilio-video";

import { User } from "types/User";

import { getTwilioVideoToken } from "api/video";

import { useUser } from "hooks/useUser";
import { useWorldUsersById } from "hooks/users";

import LocalParticipant from "./LocalParticipant";
import Participant from "./Participant";
import VideoErrorModal from "./VideoErrorModal";

import "./Room.scss";

interface RoomProps {
  roomName: string;
  venueName?: string;
  setUserList?: (val: User[]) => void;
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
  const { worldUsersById } = useWorldUsersById();
  const [token, setToken] = useState<string>();
  const firebase = useFirebase();

  useEffect(
    () => setParticipantCount && setParticipantCount(participants.length),
    [participants.length, setParticipantCount]
  );

  const userFriendlyVideoError = (originalMessage: string) => {
    if (originalMessage.toLowerCase().includes("unknown")) {
      return `${originalMessage}; common remedies include closing any other programs using your camera, and giving your browser permission to access the camera.`;
    }
    return originalMessage;
  };

  // @debt refactor this to use useAsync or similar?
  useEffect(() => {
    if (!user) return;

    getTwilioVideoToken({
      userId: user.uid,
      roomName,
    }).then(setToken);
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
      .catch((error) => setVideoError(userFriendlyVideoError(error.message)));
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
    if (!user || !profile || !venueName) return;
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
          // @debt Remove when root issue found and fixed
          console.error(
            "Could not find disconnnected participant:",
            participant
          );
          Bugsnag.notify(
            new Error("Could not find disconnnected participant"),
            (event) => {
              const { identity, sid } = participant;
              event.addMetadata("Room::participantDisconnected", {
                identity,
                sid,
              });
            }
          );
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
    if (!room || !setUserList) return;

    setUserList([
      ...participants.map((p) => worldUsersById[p.identity]),
      worldUsersById[room.localParticipant.identity],
    ]);
  }, [participants, setUserList, worldUsersById, room]);

  const getIsUserBartender = (userIdentity?: string) => {
    if (!userIdentity) return;

    return worldUsersById?.[userIdentity]?.data?.[roomName]?.bartender;
  };

  // Ordering of participants:
  // 1. Me
  // 2. Bartender, if found (only one allowed)
  // 3. Rest of the participants, in order

  // Only allow the first bartender to appear as bartender
  const userIdentity = room?.localParticipant?.identity;

  const meIsBartender = getIsUserBartender(userIdentity);

  // Video stream and local participant take up 2 slots
  // Ensure capacity is always even, so the grid works

  const profileData = room
    ? worldUsersById[room.localParticipant.identity]
    : undefined;

  const participantContainerClassName = useMemo(() => {
    const attendeeCount = (participants.length ?? 0) + 1; // Include yourself
    if (attendeeCount <= 4) {
      return "two-across";
    }
    return "three-across";
  }, [participants.length]);

  const meComponent = useMemo(() => {
    return room && profileData ? (
      <div className={`participant-container ${participantContainerClassName}`}>
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
  }, [
    meIsBartender,
    room,
    profileData,
    defaultMute,
    participantContainerClassName,
  ]);

  const othersComponents = useMemo(
    () =>
      participants.map((participant, index) => {
        if (!participant) {
          return null;
        }

        const bartender = !!meIsBartender
          ? worldUsersById[participant.identity]?.data?.[roomName]?.bartender
          : undefined;

        return (
          <div
            key={participant.identity}
            className={`participant-container ${participantContainerClassName}`}
          >
            <Participant
              key={`${participant.sid}-${index}`}
              participant={participant}
              profileData={worldUsersById[participant.identity]}
              profileDataId={participant.identity}
              bartender={bartender}
            />
          </div>
        );
      }),
    [
      meIsBartender,
      participants,
      roomName,
      worldUsersById,
      participantContainerClassName,
    ]
  );

  const emptyComponents = useMemo(
    () =>
      hasChairs
        ? Array(participants.length % 2).map((e, index) => (
            <div
              key={`empty-participant-${index}`}
              className={`participant-container ${participantContainerClassName}`}
            >
              <img
                className="empty-chair-image"
                src="/empty-chair.png"
                alt="empty chair"
              />
            </div>
          ))
        : [],
    [hasChairs, participants.length, participantContainerClassName]
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
