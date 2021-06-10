import React, { useCallback, useState } from "react";
import { updateRoom } from "api/admin";
import { faCaretRight, faCaretDown } from "@fortawesome/free-solid-svg-icons";

import { VenueTemplate, Venue_v2 } from "types/venues";
import { RoomData_v2 } from "types/rooms";

import { useVenueId } from "hooks/useVenueId";
import { useUser } from "hooks/useUser";

import "./Spaces.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BackgroundSelect from "pages/Admin/BackgroundSelect";
import MapPreview from "pages/Admin/MapPreview";
import { VenueRoomItem } from "components/molecules/VenueRoomItem";
import { EditSpace } from "components/molecules/EditSpace";

interface VenueRooms {
  text: string;
  template?: VenueTemplate;
  icon: string;
}

const venueRooms: VenueRooms[] = [
  {
    text: "Conversation Space",
    icon: "/icons/icon-room-conversation.svg",
    template: VenueTemplate.conversationspace,
  },
  {
    text: "Auditorium",
    icon: "/icons/icon-room-auditorium.svg",
    template: VenueTemplate.audience,
  },
  {
    text: "Music Bar",
    icon: "/icons/icon-room-musicbar.svg",
    template: VenueTemplate.jazzbar,
  },
  {
    text: "Burn Barrel",
    icon: "/icons/icon-room-burnbarrel.svg",
    template: VenueTemplate.firebarrel,
  },
  {
    text: "Art Piece",
    icon: "/icons/icon-room-artpiece.svg",
    template: VenueTemplate.artpiece,
  },
  {
    text: "Experience",
    icon: "/icons/icon-room-experience.svg",
    template: VenueTemplate.zoomroom,
  },
  {
    text: "External link",
    icon: "/icons/icon-room-externallink.svg",
  },
  {
    text: "Map",
    icon: "/icons/icon-room-map.svg",
    template: VenueTemplate.partymap,
  },
];

export interface SpacesProps {
  venue: Venue_v2;
}

export const Spaces: React.FC<SpacesProps> = ({ venue }) => {
  const [selectedRoom, setSelectedRoom] = useState<RoomData_v2>();
  const [showRooms, setShowRooms] = useState<boolean>(false);
  // const [showGrid, setShowGrid] = useState<boolean>(false)
  const [updatedRooms, test] = useState<RoomData_v2[]>(venue.rooms ?? []);
  console.log(test);

  const [showAddRoom, setShowAddRoom] = useState<boolean>(false);
  // const [newRoomPreview, setNewRoomPreview] = useState<RoomData_v2>()
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(
    false
  );
  const { user } = useUser();

  const venueId = useVenueId();
  const hasSelectedRoom = !!selectedRoom;
  const numberOfRooms = venue.rooms?.length ?? 0;

  const clearSelectedRoom = useCallback(() => {
    setSelectedRoom(undefined);
  }, []);

  const handleSavePositions = async () => {
    if (!venueId || !user) return;

    const roomIndex = updatedRooms.findIndex(
      (room) => room.title === selectedRoom?.title
    );
    const room = updatedRooms[roomIndex];
    await updateRoom(room, venueId, user, roomIndex);
    setSelectedRoom(undefined);
  };

  // const addNewRoomPreview = useCallback(() => {
  //   const newPreview = {
  //     x_percent: 50,
  //     y_percent: 50,
  //     width_percent: 5,
  //     height_percent: 5,
  //   }
  // }, [])

  const selectedRoomIndex =
    venue.rooms?.findIndex((room) => room === selectedRoom) ?? 0;

  return (
    <div className="spaces">
      <div className="spaces__rooms">
        {hasSelectedRoom ? (
          <EditSpace
            room={selectedRoom!}
            roomIndex={selectedRoomIndex}
            onBackPress={clearSelectedRoom}
            onDelete={clearSelectedRoom}
            onEdit={handleSavePositions}
          />
        ) : (
          <>
            <div className="spaces__background">
              <div className="spaces__title">Build your spaces</div>
            </div>
            <div>
              <div
                className="spaces__venue-rooms"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <div>Map background</div>
                <FontAwesomeIcon
                  icon={!showAdvancedSettings ? faCaretRight : faCaretDown}
                />{" "}
              </div>
              {showAdvancedSettings && (
                <BackgroundSelect venueName={venue.name} mapBackground={""} />
              )}
            </div>

            <div>
              <div
                className="spaces__venue-rooms"
                onClick={() => setShowRooms(!showRooms)}
              >
                <div>Rooms {numberOfRooms}</div>
                <FontAwesomeIcon
                  icon={!showRooms ? faCaretRight : faCaretDown}
                />
              </div>

              {showRooms && (
                <div>
                  {venue.rooms?.map((room, index) => {
                    return (
                      <div
                        key={`${index}-${room.title}`}
                        className="spaces__venue-room"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div
                          className="spaces__venue-room-logo"
                          style={{ backgroundImage: `url(${room.image_url})` }}
                        />
                        <div className="spaces__venue-room-title">
                          {room.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="spaces__venue-rooms"
              onClick={() => setShowAddRoom(!showAddRoom)}
            >
              <div>Add rooms</div>
              <FontAwesomeIcon
                icon={!showAddRoom ? faCaretRight : faCaretDown}
              />
            </div>
            {showAddRoom &&
              venueRooms.map((venueRoom, index) => (
                <VenueRoomItem
                  key={`${venueRoom.text}-${index}`}
                  text={venueRoom.text}
                  template={venueRoom.template}
                  icon={venueRoom.icon}
                />
              ))}
            <div className="spaces__footer">
              <div className="spaces__home-button">
                <div className="spaces__home-icon" />
              </div>
              <div className="spaces__nav-buttons">
                <div className="spaces__back-button">Back</div>
                <div className="spaces__next-button">Next</div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="spaces__map">
        <MapPreview
          isEditing={hasSelectedRoom}
          setIsEditing={() => {}}
          venueId={venue.id}
          venueName={venue.name}
          mapBackground={venue.mapBackgroundImageUrl}
          // setSelectedRoom={setSelectedRoom}
          rooms={venue.rooms ?? []}
          // onRoomChange={setUpdatedRooms}
          // selectedRoom={selectedRoom}
        />
      </div>
    </div>
  );
};
