import React, { useCallback, useEffect, useState } from "react";
import { CampVenue } from "types/CampVenue";
import { CampRoomData } from "types/CampRoomData";
import "./Map.scss";
import { enterRoom } from "../../../../utils/useLocationUpdateEffect";
import { useUser } from "../../../../hooks/useUser";
import { IS_BURN } from "secrets";
import { RoomVisibility } from "types/Venue";
import { useDispatch } from "hooks/useDispatch";
import { retainAttendance } from "store/actions/Attendance";
import { currentTimeInUnixEpoch } from "utils/time";
import UserProfilePicture from "components/molecules/UserProfilePicture";
import { User } from "types/User";
import { WithId } from "utils/id";
import { useSelector } from "hooks/useSelector";
import { useVenueId } from "hooks/useVenueId";
import UserProfileModal from "components/organisms/UserProfileModal";
import { useFirebase, useFirestoreConnect } from "react-redux-firebase";
import {
  ChatRequest,
  ChatRequestState,
  ChatRequestType,
} from "types/ChatRequest";
import { startOfDay } from "date-fns";
import ChatRequestModal from "./ChatRequestModal";
import Room from "components/organisms/Room";

interface PropsType {
  venue: CampVenue;
  attendances: { [location: string]: number };
  selectedRoom: CampRoomData | undefined;
  setSelectedRoom: (room: CampRoomData | undefined) => void;
  setIsRoomModalOpen: (value: boolean) => void;
}

const DEFAULT_COLUMNS = 40;
const DEFAULT_ROWS = 25;
const MOVEMENT_INTERVAL = 250;

export const Map: React.FC<PropsType> = ({
  venue,
  attendances,
  selectedRoom,
  setSelectedRoom,
  setIsRoomModalOpen,
}) => {
  const firebase = useFirebase();
  const venueId = useVenueId();
  const { user, profile } = useUser();
  const dispatch = useDispatch();
  const [roomClicked, setRoomClicked] = useState<string | undefined>(undefined);
  const [roomHovered, setRoomHovered] = useState<CampRoomData | undefined>(
    undefined
  );
  const [selectedUserProfile, setSelectedUserProfile] = useState<
    WithId<User>
  >();
  const [keyDown, setKeyDown] = useState(false);
  const [isHittingRoom, setIsHittingRoom] = useState(false);
  const [chatRequest, setChatRequest] = useState<ChatRequest>();
  const [startVideoChat, setStartVideoStart] = useState(false);

  const columns = venue.columns ?? DEFAULT_COLUMNS;
  const rows = venue.rows ?? DEFAULT_ROWS;
  const rooms = [...venue.rooms];

  useFirestoreConnect([
    {
      collection: "experiences",
      doc: venue.id,
      subcollections: [{ collection: "chatRequests" }],
      storeAs: "chatRequests",
      where: [["createdAt", ">=", startOfDay(new Date()).getTime()]],
      orderBy: ["createdAt", "asc"],
    },
  ]);

  const { partygoers, chatRequests } = useSelector((state) => ({
    partygoers: state.firestore.ordered.partygoers,
    chatRequests: state.firestore.ordered.chatRequests,
  }));

  const takeSeat = useCallback(
    (row: number | null, column: number | null) => {
      if (!user || !profile || !venueId) return;
      const doc = `users/${user.uid}`;
      const existingData = profile?.data;
      const update = {
        data: {
          ...existingData,
          [venueId]: {
            row,
            column,
          },
        },
      };
      const firestore = firebase.firestore();
      firestore
        .doc(doc)
        .update(update)
        .catch(() => {
          firestore.doc(doc).set(update);
        });
    },
    [profile, user, venueId, firebase]
  );

  const useKeyPress = function (targetKey: string) {
    const [keyPressed, setKeyPressed] = useState(false);

    function downHandler({ key }: { key: string }) {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    }

    const upHandler = ({ key }: { key: string }) => {
      if (key === targetKey) {
        setKeyDown(false);
        setKeyPressed(false);
      }
    };

    useEffect(() => {
      window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) >
          -1
        ) {
          e.preventDefault();
        }
        downHandler(e);
      });
      window.addEventListener("keyup", upHandler);

      return () => {
        window.removeEventListener("keydown", downHandler);
        window.removeEventListener("keyup", upHandler);
      };
    });

    return keyPressed;
  };

  const downPress = useKeyPress("ArrowDown");
  const upPress = useKeyPress("ArrowUp");
  const leftPress = useKeyPress("ArrowLeft");
  const rightPress = useKeyPress("ArrowRight");
  const enterPress = useKeyPress("Enter");

  const hitRoom = useCallback(
    (r: number, c: number) => {
      let isHitting = false;
      rooms.forEach((room: CampRoomData) => {
        const rowPosition = (100 / rows) * r;
        const colPosition = (100 / columns) * c;
        const roomX = Math.round(room.x_percent);
        const roomY = Math.round(room.y_percent);
        const roomWidth = Math.round(room.width_percent);
        const roomHeight = Math.round(room.height_percent);

        if (
          rowPosition >= roomY &&
          rowPosition <= roomY + roomHeight &&
          colPosition >= roomX &&
          colPosition <= roomX + roomWidth
        ) {
          setSelectedRoom(room);
          setIsHittingRoom(true);
          isHitting = true;
        } else {
          if (isHittingRoom && selectedRoom === room) {
            setSelectedRoom(undefined);
            setIsHittingRoom(false);
          }
        }
        return isHitting;
      });
      return isHitting;
    },
    [columns, isHittingRoom, rooms, rows, selectedRoom, setSelectedRoom]
  );

  const isExternalLink = useCallback(
    (url: string) =>
      url.includes("http") &&
      new URL(window.location.href).host !== new URL(getRoomUrl(url)).host,
    []
  );

  const roomEnter = useCallback(
    (room: CampRoomData) => {
      room &&
        user &&
        enterRoom(
          user,
          { [`${venue.name}/${room.title}`]: currentTimeInUnixEpoch },
          profile?.lastSeenIn
        );
    },
    [profile, user, venue]
  );

  const partygoersBySeat: WithId<User>[][] = [];
  partygoers &&
    partygoers.forEach((partygoer) => {
      if (
        !venueId ||
        !partygoer?.id ||
        !partygoer?.data ||
        partygoer.data[venueId] === undefined ||
        partygoer.data[venueId].row === undefined ||
        partygoer.data[venueId].column === undefined
      )
        return;
      const row = partygoer.data[venueId].row || 0;
      const column = partygoer.data[venueId].column || 0;
      if (!(row in partygoersBySeat)) {
        partygoersBySeat[row] = [];
      }
      partygoersBySeat[row][column] = partygoer;
    });

  useEffect(() => {
    if (!venueId) return;

    const currentPosition = profile?.data?.[venueId];
    if ((!currentPosition?.row && !currentPosition?.column) || keyDown) {
      return;
    }

    setTimeout(() => setKeyDown(false), MOVEMENT_INTERVAL);

    const { row, column } = currentPosition;
    if (row && column) {
      const seatTaken = (r: number, c: number) => partygoersBySeat?.[r]?.[c];
      if (enterPress && selectedRoom) {
        setKeyDown(true);

        const isExternalUrl = isExternalLink(selectedRoom.url);
        window.open(
          getRoomUrl(selectedRoom.url),
          isExternalUrl ? "_blank" : "noopener,noreferrer"
        );
        roomEnter(selectedRoom);
      }
      if (downPress) {
        setKeyDown(true);

        if (row + 1 > DEFAULT_ROWS || seatTaken(row + 1, column)) {
          return;
        }
        hitRoom(row + 1, column);
        takeSeat(row + 1, column);
      }
      if (upPress) {
        setKeyDown(true);

        if (row - 1 < 1 || seatTaken(row - 1, column)) {
          return;
        }
        hitRoom(row - 1, column);
        takeSeat(row - 1, column);
        return;
      }
      if (leftPress) {
        setKeyDown(true);

        if (column - 1 < 1 || seatTaken(row, column - 1)) {
          return;
        }
        hitRoom(row, column - 1);

        takeSeat(row, column - 1);
        return;
      }
      if (rightPress) {
        setKeyDown(true);

        if (column + 1 > DEFAULT_COLUMNS || seatTaken(row, column + 1)) {
          return;
        }
        hitRoom(row, column + 1);

        takeSeat(row, column + 1);
        return;
      }
    }
  }, [
    downPress,
    leftPress,
    profile,
    rightPress,
    takeSeat,
    upPress,
    user,
    venue,
    hitRoom,
    venueId,
    enterPress,
    selectedRoom,
    partygoersBySeat,
    roomEnter,
    isExternalLink,
    keyDown,
  ]);

  useEffect(() => {
    let requests: ChatRequest[] = chatRequests ?? [];
    const currentChatRequest = requests.filter((request) => {
      return (
        request.state === ChatRequestState.Asked && request.toUid === user?.uid
      );
    })[0];
    setChatRequest(currentChatRequest ?? {});
  }, [chatRequests, setChatRequest, user]);

  if (!venue) {
    return <>Loading map...</>;
  }

  if (roomHovered) {
    const idx = rooms.findIndex((room) => room.title === roomHovered.title);
    if (idx !== -1) {
      const chosenRoom = rooms.splice(idx, 1);
      rooms.push(chosenRoom[0]);
    }
  }

  const getRoomUrl = (roomUrl: string) => {
    return roomUrl.includes("http") ? roomUrl : "//" + roomUrl;
  };

  const openModal = (room: CampRoomData) => {
    setSelectedRoom(room);
    setIsRoomModalOpen(true);
  };

  const onSeatClick = (
    row: number,
    column: number,
    seatedPartygoer: WithId<User> | null
  ) => {
    if (!seatedPartygoer) {
      takeSeat(row, column);
    }
    rooms.forEach((room: CampRoomData) => {
      const rowPosition = (100 / rows) * row;
      const colPosition = (100 / columns) * column;
      const roomX = Math.trunc(room.x_percent);
      const roomY = Math.trunc(room.y_percent);
      const roomWidth = Math.trunc(room.width_percent);
      const roomHeight = Math.trunc(room.height_percent);

      if (
        !seatedPartygoer &&
        rowPosition >= roomY &&
        rowPosition <= roomY + roomHeight &&
        colPosition >= roomX &&
        colPosition <= roomX + roomWidth
      ) {
        setSelectedRoom(room);
        setIsRoomModalOpen(true);
      } else {
        if (isHittingRoom && selectedRoom) {
          setSelectedRoom(undefined);
          setIsHittingRoom(false);
        }
      }
    });
  };

  const sendChatRequest = (userId: string) => {
    const chatRequest: ChatRequest = {
      fromUid: user!.uid,
      toUid: userId,
      toJoinRoomOwnedByUid: user!.uid,
      type: ChatRequestType.JoinMyChat,
      state: ChatRequestState.Asked,
      createdAt: new Date().getTime(),
      fromJoined: false,
      toJoined: false,
    };
    firebase
      .firestore()
      .collection(`experiences/${venue.id}/chatRequests`)
      .add(chatRequest);
  };

  const myPosition = profile?.data?.[venue.id];
  const currentRow = myPosition?.row ?? 0;
  const currentCol = myPosition?.column ?? 0;
  const avatarWidth = 100 / columns;
  const avatarHeight = 100 / rows;
  const colPosition = avatarWidth * currentCol;
  const rowPosition = avatarHeight * currentRow;
  const videoChatHost = partygoers.find(
    (partygoer) => partygoer.id === chatRequest?.fromUid
  );

  return (
    <>
      <div
        className="grid-container"
        style={{
          backgroundImage: `url(${venue.mapBackgroundImageUrl})`,
          backgroundSize: "cover",
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, calc(100% / ${columns}))`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from(Array(columns)).map((_, colIndex) => {
          return (
            <div className="seat-row" key={`column${colIndex}`}>
              {Array.from(Array(rows)).map((_, rowIndex) => {
                const column = colIndex + 1;
                const row = rowIndex + 1;
                const seatedPartygoer = partygoersBySeat?.[row]?.[column]
                  ? partygoersBySeat[row][column]
                  : null;
                const isMe = seatedPartygoer?.id === user?.uid;
                return (
                  <div key={`row${rowIndex}`} className={`seat-container`}>
                    {venue.showGrid && (
                      <div
                        className={seatedPartygoer ? "seat" : `not-seat`}
                        onClick={() =>
                          onSeatClick(row, column, seatedPartygoer)
                        }
                        key={`row${rowIndex}`}
                      >
                        {seatedPartygoer && (
                          <div className={isMe ? "user avatar" : "user"}>
                            {!isMe && (
                              <UserProfilePicture
                                user={seatedPartygoer}
                                profileStyle={"profile-avatar"}
                                setSelectedUserProfile={setSelectedUserProfile}
                                miniAvatars={venue?.miniAvatars}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {venue.showGrid && rowPosition && colPosition && (
                <div
                  style={{
                    display: "flex",
                    width: `${avatarWidth}%`,
                    height: `${avatarHeight}%`,
                    position: "absolute",
                    cursor: "pointer",
                    transition: "all 1400ms cubic-bezier(0.23, 1 ,0.32, 1)",
                    top: `${avatarHeight * (currentRow - 1)}%`,
                    left: `${avatarWidth * (currentCol - 1)}%`,
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="me"
                    style={{
                      width: "80%",
                      height: "80%",
                      borderRadius: "100%",
                      alignSelf: "center",
                      backgroundImage: `url(${profile?.pictureUrl})`,
                      backgroundSize: "cover",
                    }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
        {!!rooms.length &&
          rooms.map((room) => {
            const left = room.x_percent;
            const top = room.y_percent;
            const width = room.width_percent;
            const height = room.height_percent;
            const isUnderneathRoom = isHittingRoom && room === selectedRoom;

            return (
              <div
                className={`room position-absolute ${
                  isUnderneathRoom && "isUnderneath"
                }`}
                style={{
                  left: left + "%",
                  top: top + "%",
                  width: width + "%",
                  height: height + "%",
                }}
                key={room.title}
                onClick={() => {
                  if (!IS_BURN) {
                    openModal(room);
                  } else {
                    setRoomClicked((prevRoomClicked) =>
                      prevRoomClicked === room.title ? undefined : room.title
                    );
                  }
                }}
                onMouseEnter={() => {
                  dispatch(retainAttendance(true));
                  setRoomHovered(room);
                }}
                onMouseLeave={() => {
                  dispatch(retainAttendance(false));
                  setRoomHovered(undefined);
                }}
              >
                <div
                  className={`camp-venue ${
                    roomClicked === room.title ? "clicked" : ""
                  }`}
                >
                  <div
                    className={`grid-room-btn ${
                      isUnderneathRoom && "isUnderneath"
                    }`}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const isExternalUrl = isExternalLink(room.url);
                        window.open(
                          getRoomUrl(room.url),
                          isExternalUrl ? "_blank" : "noopener,noreferrer"
                        );
                        roomEnter(room);
                      }}
                      className="btn btn-white btn-small btn-block"
                    >
                      Join now
                    </div>
                  </div>
                  <div className="camp-venue-img">
                    <img
                      src={room.image_url}
                      title={room.title}
                      alt={room.title}
                    />
                  </div>
                  {venue.roomVisibility === RoomVisibility.nameCount &&
                    roomHovered &&
                    roomHovered.title === room.title && (
                      <div className="camp-venue-text">
                        <div className="camp-venue-maininfo">
                          <div className="camp-venue-title">{room.title}</div>

                          {(attendances[`${venue.name}/${room.title}`] ?? 0) +
                            (room.attendanceBoost ?? 0) >
                            0 && (
                            <div className="camp-venue-people">
                              {(attendances[`${venue.name}/${room.title}`] ??
                                0) + (room.attendanceBoost ?? 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className={`camp-venue-text`}>
                    {(!venue.roomVisibility ||
                      venue.roomVisibility === RoomVisibility.nameCount ||
                      venue.roomVisibility === RoomVisibility.count) && (
                      <div className="camp-venue-maininfo">
                        {(!venue.roomVisibility ||
                          venue.roomVisibility ===
                            RoomVisibility.nameCount) && (
                          <div className="camp-venue-title">{room.title}</div>
                        )}

                        {(attendances[`${venue.name}/${room.title}`] ?? 0) +
                          (room.attendanceBoost ?? 0) >
                          0 && (
                          <div className="camp-venue-people">
                            {(attendances[`${venue.name}/${room.title}`] ?? 0) +
                              (room.attendanceBoost ?? 0)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="camp-venue-secondinfo">
                      <div className="camp-venue-desc">
                        <p>{room.subtitle}</p>
                        <p>{room.about}</p>
                      </div>
                      <div className="camp-venue-actions">
                        {isExternalLink(room.url) ? (
                          <a
                            className="btn btn-block btn-small btn-primary"
                            onClick={() => roomEnter(room)}
                            href={getRoomUrl(room.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {venue.joinButtonText ?? "Join the room"}
                          </a>
                        ) : (
                          <a
                            className="btn btn-block btn-small btn-primary"
                            onClick={() => roomEnter(room)}
                            href={getRoomUrl(room.url)}
                          >
                            {venue.joinButtonText ?? "Join the room"}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        <button
          style={{ marginLeft: "50%", width: 100, height: 50, zIndex: 2000 }}
          title="test"
          onClick={() => sendChatRequest("add target UID here")}
        >
          Test invite
        </button>
        {chatRequest && videoChatHost && (
          <ChatRequestModal
            show={!!chatRequest}
            host={videoChatHost}
            request={chatRequest}
          />
        )}
        {startVideoChat && (
          <div className="grid-video-container">
            <Room
              roomName={`${venue.name}/${user?.uid}`}
              venueName={venue.name}
              setUserList={() => {}}
            />
          </div>
        )}
        {selectedUserProfile && (
          <UserProfileModal
            show={!!selectedUserProfile}
            onHide={() => setSelectedUserProfile(undefined)}
            userProfile={selectedUserProfile}
          />
        )}
      </div>
    </>
  );
};
