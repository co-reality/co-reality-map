import React, {
  useCallback,
  useState,
  useMemo,
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { useDrop } from "react-dnd";
import update from "immutability-helper";
import ReactResizeDetector from "react-resize-detector";

import { Dimensions, Position } from "types/utility";
import { RoomData_v2 } from "types/rooms";

import { DragItem } from "pages/Account/Venue/VenueMapEdition/interfaces";
import { ItemTypes } from "pages/Account/Venue/VenueMapEdition/ItemTypes";
import { DraggableSubvenue } from "pages/Account/Venue/VenueMapEdition/DraggableSubvenue";
import { CustomDragLayer } from "pages/Account/Venue/VenueMapEdition";
import { snapToGrid as doSnapToGrid } from "pages/Account/Venue/VenueMapEdition/snapToGrid";

const styles: React.CSSProperties = {
  width: "100%",
  position: "relative",
};

export interface RoomIcon {
  top: number;
  left: number;
  url: string;
  width: number;
  height: number;
  roomIndex?: number;
}

export interface RoomIconsMap {
  [key: string]: RoomIcon;
}

interface CoordinatesBoundary {
  width: number;
  height: number;
}

interface PropsType {
  snapToGrid?: boolean;
  roomIcons?: RoomIcon[];
  backgroundImage: string;
  iconImageStyle?: CSSProperties; // This is not being used ATM
  draggableIconImageStyle?: CSSProperties; // This is not being used ATM
  roomIconsMap?: RoomIconsMap;
  onOtherIconClick?: (key: string) => void;
  coordinatesBoundary: CoordinatesBoundary;
  interactive: boolean;
  resizable: boolean;
  onResize?: (size: Dimensions) => void;
  onMove?: (position: Position) => void;
  otherIconsStyle?: CSSProperties;
  rounded?: boolean;
  backgroundImageStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  lockAspectRatio?: boolean;
  rooms: RoomData_v2[];
  selectedRoom: RoomData_v2 | undefined;
  setSelectedRoom: Dispatch<SetStateAction<RoomData_v2 | undefined>>;
}

export const Container: React.FC<PropsType> = ({
  snapToGrid,
  roomIcons,
  backgroundImage,
  iconImageStyle,
  coordinatesBoundary,
  interactive,
  resizable,
  rounded,
  backgroundImageStyle,
  containerStyle,
  lockAspectRatio,
  rooms,
  selectedRoom,
  setSelectedRoom,
  onResize,
  onMove,
}) => {
  const roomIconsArray = useMemo(() => roomIcons ?? [], [roomIcons]);

  const [boxes, setBoxes] = useState<RoomIconsMap>({});
  const [imageDims, setImageDims] = useState<Dimensions>();

  const convertDisplayedCoordToIntrinsic = useCallback(
    (
      val: number,
      dimension: "height" | "width",
      coordinateBoundary: number
    ) => {
      if (!imageDims) return 0;
      return (coordinateBoundary * val) / imageDims[dimension];
    },
    [imageDims]
  );

  useEffect(() => {
    if (!imageDims) return;
    const iconsMap = Object.keys(roomIconsArray).reduce(
      (acc, stringIndex: string) => {
        const index = parseInt(stringIndex);
        return {
          ...acc,
          [index]: {
            ...roomIconsArray[index],
            width: resizable
              ? (imageDims.width * roomIconsArray[index].width) /
                coordinatesBoundary.width
              : roomIconsArray[index].width,
            height: resizable
              ? (imageDims.height * roomIconsArray[index].height) /
                coordinatesBoundary.height
              : roomIconsArray[index].height,
            top:
              (imageDims.height * roomIconsArray[index].top) /
              coordinatesBoundary.height,
            left:
              (imageDims.width * roomIconsArray[index].left) /
              coordinatesBoundary.width,
          },
        };
      },
      {}
    );

    setBoxes(iconsMap);
  }, [
    coordinatesBoundary.height,
    coordinatesBoundary.width,
    imageDims,
    resizable,
    roomIconsArray,
  ]);

  const moveBox = useCallback(
    (id: string, left: number, top: number) => {
      onMove?.({
        left: convertDisplayedCoordToIntrinsic(
          left,
          "width",
          coordinatesBoundary.width
        ),
        top: convertDisplayedCoordToIntrinsic(
          top,
          "height",
          coordinatesBoundary.height
        ),
      });
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
    },
    [
      boxes,
      convertDisplayedCoordToIntrinsic,
      coordinatesBoundary.height,
      coordinatesBoundary.width,
      onMove,
    ]
  );

  const resizeBox = useCallback(
    (id: string) => (dimensions: Dimensions) => {
      if (!imageDims) return;

      const { width, height } = dimensions;

      onResize?.({
        width: resizable
          ? (coordinatesBoundary.width * width) / imageDims.width
          : width,
        height: resizable
          ? (coordinatesBoundary.height * height) / imageDims.height
          : height,
      });
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { width, height },
          },
        })
      );
    },
    [
      boxes,
      coordinatesBoundary.height,
      coordinatesBoundary.width,
      imageDims,
      onResize,
      resizable,
    ]
  );

  const [, drop] = useDrop({
    accept: ItemTypes.SUBVENUE_ICON,
    drop(item: DragItem, monitor) {
      if (!interactive) return;
      const delta = monitor.getDifferenceFromInitialOffset() as {
        x: number;
        y: number;
      };

      let left = Math.round(item.left + delta.x);
      let top = Math.round(item.top + delta.y);
      if (snapToGrid) {
        [left, top] = doSnapToGrid(left, top);
      }

      moveBox(item.id, left, top);
    },
  });

  const renderSelectedRoom = (index: number) => {
    return (
      <>
        <DraggableSubvenue
          isResizable={resizable}
          id={index.toString()}
          imageStyle={iconImageStyle}
          rounded={!!rounded}
          {...boxes[index]}
          onChangeSize={resizeBox(index.toString())}
          lockAspectRatio={lockAspectRatio}
        />
        {imageDims && interactive && (
          <CustomDragLayer
            snapToGrid={!!snapToGrid}
            rounded={!!rounded}
            iconSize={boxes[Object.keys(boxes)[index]]}
          />
        )}
      </>
    );
  };

  return (
    <div ref={drop} style={{ ...styles, ...containerStyle }}>
      <ReactResizeDetector
        handleWidth
        handleHeight
        onResize={(width, height) => setImageDims({ width, height })}
      />
      <img
        alt="draggable background "
        style={{
          width: "100%",
          ...backgroundImageStyle,
        }}
        src={backgroundImage}
      />

      {backgroundImage &&
        rooms.map((room, index) =>
          room === selectedRoom ? (
            <div key={`${room.title}-${index}`}>
              {renderSelectedRoom(index)}
            </div>
          ) : (
            <div
              className="map-preview__room"
              key={`${room.title}-${index}`}
              onClick={() => !selectedRoom && setSelectedRoom(room)}
              style={{
                position: "absolute",
                top: `${room.y_percent}%`,
                left: `${room.x_percent}%`,
                width: `${room.width_percent}%`,
                height: `${room.height_percent}%`,
              }}
            >
              <img
                style={{
                  width: "100%",
                  height: "100%",
                  filter: room.isEnabled ? "none" : "grayscale(100%)",
                  opacity: room.isEnabled ? 1 : 0.5,
                  transition: "filter .3s ease",
                }}
                src={room.image_url}
                alt="room banner"
                title={room.title}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignContent: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: "22px",
                  padding: "6px 8px",
                  fontSize: "0.8rem",
                  transition: "all 400ms cubic-bezier(0.23, 1, 0.32, 1)",
                  whiteSpace: "nowrap",
                }}
              >
                {room.title}
              </div>
            </div>
          )
        )}
    </div>
  );
};
