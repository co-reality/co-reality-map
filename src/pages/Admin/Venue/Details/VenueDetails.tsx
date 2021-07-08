import React, { useCallback, useEffect, useRef, useState } from "react";
import firebase from "firebase/app";
import { useFirestoreConnect } from "hooks/useFirestoreConnect";
import { isEqual } from "lodash";
import { Link } from "react-router-dom";

import { updateRoom } from "api/admin";

import { venueLandingUrl } from "utils/url";

import { useUser } from "hooks/useUser";

import { Room, RoomData_v2 } from "types/rooms";
import { VenueDetailsProps } from "./VenueDetails.types";

import { VenueCard } from "components/molecules/VenueCard";
import { Button } from "components/atoms/Button";
import AdminEventModal from "pages/Admin/AdminEventModal";
import { RoomEditModal } from "pages/Admin/Room/Edit";
import RoomModal from "pages/Admin/Room/Modal";
import RoomCard from "pages/Admin/Room/Card";
import MapPreview from "pages/Admin/MapPreview";
import { VenueOwnersModal } from "pages/Admin/VenueOwnersModal";
import RoomDeleteModal from "../Rooms/RoomDeleteModal";

import * as S from "./VenueDetails.styles";
import {
  DEFAULT_MAP_BACKGROUND,
  DEFAULT_VENUE_BANNER,
  DEFAULT_VENUE_LOGO,
} from "settings";

type Owner = {
  id: string;
  data: unknown;
  partyName: string;
  pictureUrl: string;
};

type EditRoomType = RoomData_v2 & {
  roomIndex: number;
};

const noop = () => {};

const VenueDetails: React.FC<VenueDetailsProps> = ({ venue }) => {
  const {
    name,
    owners,
    id: venueId,
    rooms,
    mapBackgroundImageUrl = DEFAULT_MAP_BACKGROUND,
  } = venue;
  const {
    subtitle,
    description,
    coverImageUrl,
  } = venue.config.landingPageConfig;
  const { icon } = venue.host;
  const { user } = useUser();

  const [ownersData, setOwnersData] = useState<Owner[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

  const openPreviewLandingPage = useCallback(() => {
    window.open(venueLandingUrl(venue.id));
  }, [venue.id]);

  const toggleRoomModal = useCallback(() => setModalOpen(!modalOpen), [
    modalOpen,
  ]);

  const handleEditRoom = useCallback((room: RoomData_v2, index: number) => {
    setEditingRoom({
      ...room,
      roomIndex: index,
    });
  }, []);

  const handleRoomEvent = useCallback((roomName: string) => {
    setEventRoom(roomName);
    setShowEventModal(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openDeleteModal = useCallback(() => setShowDeleteModal(true), []);

  const closeDeleteModal = useCallback(() => setShowDeleteModal(false), []);

  const closeOwnersModal = useCallback(() => setShowOwnersModal(false), []);

  const closeEventModal = useCallback(() => setShowEventModal(false), []);

  const closeEditingModal = useCallback(() => setEditingRoom(null), []);

  const handleNewRoom = useCallback(() => {
    setModalOpen(false);
    setIsEditing(true);
  }, []);

  const closeDeleteModals = useCallback(() => {
    setShowDeleteModal(false);
    setEditingRoom(null);
  }, []);

  if (!user) return null;

  const handleEditRoomSave = async (values: RoomData_v2, index: number) => {
    const roomValues: RoomData_v2 = {
      ...editingRoom,
      ...values,
    };

    await updateRoom(roomValues, venueId, user, index);
    closeEditingModal();
  };

  return (
    <S.Container>
      <S.Header>
        <VenueCard
          bannerImageUrl={
            !!coverImageUrl ? coverImageUrl : DEFAULT_VENUE_BANNER
          }
          logoImageUrl={!!icon ? icon : DEFAULT_VENUE_LOGO}
          name={name}
          subtitle={subtitle}
          description={description}
          large
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
          <Button onClick={openPreviewLandingPage}>Preview landing page</Button>

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
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          venueId={venueId!}
          venueName={name}
          mapBackground={mapBackgroundImageUrl}
          rooms={rooms ?? []}
        />

        {!!mapBackgroundImageUrl && (
          <>
            <S.RoomActions>
              <S.RoomCounter>{rooms ? rooms.length : "0"} Rooms</S.RoomCounter>
              <Button onClick={toggleRoomModal} gradient>
                Add a room
              </Button>
            </S.RoomActions>
          </>
        )}

        {!!rooms && !!mapBackgroundImageUrl && (
          <S.RoomWrapper>
            {rooms.map((room: Room, index: number) => (
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
        onSubmitHandler={handleNewRoom}
        onClickOutsideHandler={closeModal}
      />

      {editingRoom && (
        <RoomEditModal
          isVisible={!!editingRoom && !showDeleteModal}
          onClickOutsideHandler={closeEditingModal}
          room={editingRoom}
          submitHandler={handleEditRoomSave}
          deleteHandler={openDeleteModal}
        />
      )}

      {editingRoom && (
        <RoomDeleteModal
          show={showDeleteModal}
          onHide={closeDeleteModal}
          venueId={venueId!}
          room={editingRoom}
          onDelete={closeDeleteModals}
        />
      )}

      <VenueOwnersModal
        visible={showOwnersModal}
        onHide={closeOwnersModal}
        venue={venue}
      />

      <AdminEventModal
        show={showEventModal}
        venueId={venueId!}
        onHide={closeEventModal}
        setEditedEvent={noop}
        setShowDeleteEventModal={noop}
        roomName={eventRoom}
      />
    </S.Container>
  );
};

export default VenueDetails;
