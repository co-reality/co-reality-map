import React, { useCallback, useState } from "react";
import { useHistory } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretRight,
  faCaretDown,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

import { VenueTemplate, Venue_v2 } from "types/venues";
import { RoomData_v2, RoomTemplate, VenueRoomTemplate } from "types/rooms";
import { Dimensions, Position } from "types/utility";

import { BackgroundSelect } from "pages/Admin/BackgroundSelect";
import { VenueRoomItem } from "components/molecules/VenueRoomItem";
import { EditSpace } from "components/molecules/EditSpace";
import { MapPreview } from "components/organisms/AdminVenueView/components/MapPreview";

import "./Spaces.scss";

interface VenueRooms {
  text: string;
  template?: VenueRoomTemplate;
  icon: string;
}

const venueRooms: VenueRooms[] = [
  {
    text: "Conversation Space",
    icon: "/assets/icons/icon-room-conversation.svg",
    template: VenueTemplate.conversationspace,
  },
  {
    text: "Auditorium",
    icon: "/assets/icons/icon-room-auditorium.svg",
    template: VenueTemplate.audience,
  },
  {
    text: "Music Bar",
    icon: "/assets/icons/icon-room-musicbar.svg",
    template: VenueTemplate.jazzbar,
  },
  {
    text: "Burn Barrel",
    icon: "/assets/icons/icon-room-burnbarrel.svg",
    template: VenueTemplate.firebarrel,
  },
  {
    text: "Art Piece",
    icon: "/assets/icons/icon-room-artpiece.svg",
    template: VenueTemplate.artpiece,
  },
  {
    text: "Experience",
    icon: "/assets/icons/icon-room-experience.svg",
    template: VenueTemplate.zoomroom,
  },
  {
    text: "External link",
    icon: "/assets/icons/icon-room-externallink.svg",
    template: RoomTemplate.external,
  },
  {
    text: "Map",
    icon: "/assets/icons/icon-room-map.svg",
    template: VenueTemplate.partymap,
  },
];

export interface SpacesProps {
  venue: Venue_v2;
  onClickNext: () => void;
}

export const Spaces: React.FC<SpacesProps> = ({ venue, onClickNext }) => {
  const [selectedRoom, setSelectedRoom] = useState<RoomData_v2>();
  const [showRooms, setShowRooms] = useState<boolean>(false);
  const [updatedRoom, setUpdatedRoom] = useState<RoomData_v2>({});

  const [showAddRoom, setShowAddRoom] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(
    false
  );

  const history = useHistory();

  const hasSelectedRoom = !!selectedRoom;
  const numberOfRooms = venue.rooms?.length ?? 0;

  const clearSelectedRoom = useCallback(() => {
    setSelectedRoom(undefined);
    setUpdatedRoom({});
  }, []);

  const updateRoomPosition = useCallback(async (position: Position) => {
    if (!position) return;

    setUpdatedRoom((room) => ({
      ...room,
      x_percent: position.left,
      y_percent: position.top,
    }));
  }, []);

  const updateRoomSize = useCallback(async (size: Dimensions) => {
    if (!size) return;

    setUpdatedRoom((room) => ({
      ...room,
      width_percent: size.width,
      height_percent: size.height,
    }));
  }, []);

  const selectedRoomIndex =
    venue.rooms?.findIndex((room) => room === selectedRoom) ?? -1;

  return (
    <div className="Spaces">
      <div className="Spaces__rooms">
        {hasSelectedRoom ? (
          <EditSpace
            room={selectedRoom!}
            updatedRoom={updatedRoom}
            roomIndex={selectedRoomIndex}
            onBackPress={clearSelectedRoom}
            onDelete={clearSelectedRoom}
            onEdit={clearSelectedRoom}
          />
        ) : (
          <>
            <div className="Spaces__background">
              <div className="Spaces__title">Build your spaces</div>
            </div>
            <div>
              <div
                className="Spaces__venue-rooms"
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
                className="Spaces__venue-rooms"
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
                        className="Spaces__venue-room"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div
                          className="Spaces__venue-room-logo"
                          style={{ backgroundImage: `url(${room.image_url})` }}
                        />
                        <div className="Spaces__venue-room-title">
                          {room.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="Spaces__venue-rooms"
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
            <div className="Spaces__footer">
              <div
                className="Spaces__home-button"
                onClick={() => history.push("/admin-ng/")}
              >
                <FontAwesomeIcon icon={faHome} />
              </div>
              <div className="Spaces__nav-buttons">
                <div
                  className="Spaces__back-button"
                  onClick={() => history.push("/admin-ng/")}
                >
                  Back
                </div>
                <div className="Spaces__next-button" onClick={onClickNext}>
                  Next
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="Spaces__map">
        <MapPreview
          isEditing={hasSelectedRoom}
          mapBackground={venue.mapBackgroundImageUrl}
          setSelectedRoom={setSelectedRoom}
          rooms={venue.rooms ?? []}
          onMoveRoom={updateRoomPosition}
          onResizeRoom={updateRoomSize}
          selectedRoom={selectedRoom}
        />
      </div>
    </div>
  );
};
