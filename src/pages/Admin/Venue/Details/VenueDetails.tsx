import React, { useEffect, useRef, useState } from "react";
import firebase from "firebase/app";

// Components
import VenueHero from "components/molecules/VenueHero";
import Button from "components/atoms/Button";
import AdminEventModal from "pages/Admin/AdminEventModal";
import RoomEdit from "pages/Admin/Room/Edit";
import RoomModal from "pages/Admin/Room/Modal";
import RoomCard from "pages/Admin/Room/Card";

// Hooks
import { Link } from "react-router-dom";

// Typings
import { VenueDetailsProps } from "./VenueDetails.types";

// Styles
import * as S from "./VenueDetails.styles";
import MapPreview from "pages/Admin/MapPreview";
import { updateRoom } from "api/admin";
import { RoomData_v2 } from "types/RoomData";
import { useFirestoreConnect } from "react-redux-firebase";
import { isEqual } from "lodash";
import RoomDeleteModal from "../Rooms/RoomDeleteModal";
import { VenueOwnersModal } from "pages/Admin/VenueOwnersModal";
import { useUser } from "hooks/useUser";
import { AnyRoom } from "types/Venue";

type Owner = {
  id: string;
  data: unknown;
  partyName: string;
  pictureUrl: string;
};

type EditRoomType = RoomData_v2 & {
  roomIndex: number;
};

const VenueDetails: React.FC<VenueDetailsProps> = ({ venue }) => {
  const { name, owners, id: venueId, rooms, mapBackgroundImageUrl } = venue;
  const {
    subtitle,
    description,
    coverImageUrl,
  } = venue.config.landingPageConfig;
  const { icon } = venue.host;
  const { user } = useUser();

  const [ownersData, setOwnersData] = useState<Owner[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [editingRoom, setEditingRoom] = useState<EditRoomType | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventRoom, setEventRoom] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);

  useFirestoreConnect([
    {
      collection: "venues",
      doc: venueId,
      subcollections: [{ collection: "events" }],
      orderBy: ["start_utc_seconds", "asc"],
      storeAs: "events",
    },
  ]);

  const ownersRef = useRef([]);

  useEffect(() => {
    const newOwners: Owner[] = [];
    async function getOwnersData() {
      if (owners && owners.length > 0) {
        for (const owner of owners) {
          const user = await firebase
            .functions()
            .httpsCallable("venue-getOwnerData")({ userId: owner });

          const userData = user.data;

          if (ownersRef.current.filter((i: Owner) => i.id !== owner)) {
            newOwners.push({
              id: owner,
              ...userData,
            });
          }
        }

        if (!isEqual(ownersData, newOwners)) {
          setOwnersData(newOwners);
        }
      }
    }
    getOwnersData();
  }, [owners, ownersData]);

  if (!user) return null;

  const toggleRoomModal = () => setModalOpen(!modalOpen);

  const handleEditRoom = (room: RoomData_v2, index: number) => {
    setEditingRoom({
      ...room,
      roomIndex: index,
    });
  };

  const handleRoomEvent = (roomName: string) => {
    setEventRoom(roomName);
    setShowEventModal(true);
  };

  const handleEditRoomSave = (values: RoomData_v2, index: number) => {
    const newData = {
      ...values,
      x_percent: editingRoom?.x_percent,
      y_percent: editingRoom?.y_percent,
      width_percent: editingRoom?.width_percent,
      height_percent: editingRoom?.height_percent,
    };

    updateRoom(newData, venueId!, user, index);
  };

  return (
    <S.Container>
      <S.Header>
        <VenueHero
          bannerImageUrl={coverImageUrl}
          logoImageUrl={icon}
          name={name}
          subtitle={subtitle}
          description={description}
          large
          showEdit
          venueId={venue.id!}
        />

        <S.HeaderActions>
          <Link
            to={`/in/${venue.id}`}
            className="btn btn-primary"
            style={{ marginBottom: "0.5em" }}
            target="_blank"
          >
            Go to your space
          </Link>
          <Button>Preview landing page</Button>

          <S.AdminList>
            <S.AdminListTitle>Party admins</S.AdminListTitle>

            {ownersData.length > 0 &&
              ownersData.map((owner: Owner) => (
                <S.AdminItem key={owner.id}>
                  <S.AdminPicture backgroundImage={owner.pictureUrl} />
                  <S.AdminItemTitle>{owner.partyName}</S.AdminItemTitle>
                </S.AdminItem>
              ))}

            <Button onClick={() => setShowOwnersModal(true)}>
              Invite an admin
            </Button>
          </S.AdminList>
        </S.HeaderActions>
      </S.Header>

      <S.Main>
        <MapPreview
          venueId={venueId!}
          venueName={name}
          mapBackground={mapBackgroundImageUrl}
          rooms={rooms}
        />

        {!!mapBackgroundImageUrl && (
          <>
            <S.RoomActions>
              <S.RoomCounter>{rooms ? rooms.length : "0"} Rooms</S.RoomCounter>
              <Button onClick={() => toggleRoomModal()} gradient>
                Add a room
              </Button>
            </S.RoomActions>
          </>
        )}

        {!!rooms && !!mapBackgroundImageUrl && (
          <S.RoomWrapper>
            {rooms.map((room: AnyRoom, index: number) => (
              <RoomCard
                key={room.title}
                room={room}
                venueId={venueId!}
                editHandler={() => handleEditRoom(room, index)}
                onEventHandler={handleRoomEvent}
                roomIndex={index}
              />
            ))}
          </S.RoomWrapper>
        )}
      </S.Main>

      <RoomModal
        isVisible={modalOpen}
        venueId={venueId!}
        onSubmitHandler={() => setModalOpen(false)}
        onClickOutsideHandler={() => setModalOpen(false)}
      />

      {editingRoom && (
        <RoomEdit
          isVisible={!!editingRoom}
          onClickOutsideHandler={() => setEditingRoom(null)}
          room={editingRoom}
          submitHandler={handleEditRoomSave}
          deleteHandler={() => setShowDeleteModal(true)}
        />
      )}

      {editingRoom && (
        <RoomDeleteModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          venueId={venueId!}
          room={editingRoom}
          onDeleteRedirect={`/admin_v2/venue/${venueId}`}
          onDelete={() => {
            setShowDeleteModal(false);
            setEditingRoom(null);
          }}
        />
      )}

      <VenueOwnersModal
        visible={showOwnersModal}
        onHide={() => setShowOwnersModal(false)}
        venue={venue}
      />

      <AdminEventModal
        show={showEventModal}
        venueId={venueId!}
        onHide={() => setShowEventModal(false)}
        setEditedEvent={() => {}}
        setShowDeleteEventModal={() => {}}
        roomName={eventRoom}
      />
    </S.Container>
  );
};

export default VenueDetails;
