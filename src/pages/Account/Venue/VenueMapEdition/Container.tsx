import React, {
  useCallback,
  useState,
  useMemo,
  CSSProperties,
  useEffect,
} from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "./ItemTypes";
import { DraggableSubvenue } from "./DraggableSubvenue";
import { snapToGrid as doSnapToGrid } from "./snapToGrid";
import update from "immutability-helper";
import { DragItem } from "./interfaces";
import { DEFAULT_MAP_ICON_URL } from "settings";
import { CustomDragLayer } from "./CustomDragLayer";
import ReactResizeDetector from "react-resize-detector";
import { Dimensions } from "types/utility";

const styles: React.CSSProperties = {
  width: "100%",
  position: "relative",
};
export interface SubVenueIconMap {
  [key: string]: {
    title?: string;
    top: number;
    left: number;
    url: string;
    width: number;
    height: number;
    roomIndex?: number;
  };
}

interface CoordinatesBoundary {
  width: number;
  height: number;
}

interface PropsType {
  snapToGrid?: boolean;
  iconsMap: SubVenueIconMap;
  backgroundImage: string;
  iconImageStyle?: CSSProperties; // This is not being used ATM
  draggableIconImageStyle?: CSSProperties; // This is not being used ATM
  onChange?: (val: SubVenueIconMap) => void;
  otherIcons: SubVenueIconMap;
  onOtherIconClick?: (key: string) => void;
  coordinatesBoundary: CoordinatesBoundary;
  interactive: boolean;
  resizable: boolean;
  onResize?: (rawVal: Dimensions, percentageVal: Dimensions) => void;
  otherIconsStyle?: CSSProperties;
  rounded?: boolean;
  backgroundImageStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  lockAspectRatio?: boolean;
  isSaving?: boolean;
}

export const Container: React.FC<PropsType> = (props) => {
  const {
    snapToGrid,
    iconsMap,
    backgroundImage,
    iconImageStyle,
    onChange,
    otherIcons,
    onOtherIconClick,
    coordinatesBoundary,
    interactive,
    resizable,
    rounded,
    otherIconsStyle,
    backgroundImageStyle,
    containerStyle,
    lockAspectRatio,
    isSaving,
  } = props;
  const [boxes, setBoxes] = useState<SubVenueIconMap>(iconsMap);
  const [imageDims, setImageDims] = useState<Dimensions>();
  const [dragBoxId, setDragBoxId] = useState<number>(0);

  const setDragItemId = useCallback((id: number) => {
    setDragBoxId(id);
  }, []);

  // trigger the parent callback on boxes change (as a result of movement)
  useEffect(() => {
    if (!imageDims) return;

    const convertDisplayedCoordToIntrinsic = (
      val: number,
      dimension: keyof typeof imageDims,
      coordinateBoundary: number
    ) => (coordinateBoundary * val) / imageDims[dimension];

    //need to return the unscaled values
    const unscaledBoxes = Object.keys(boxes).reduce(
      (acc, val) => ({
        ...acc,
        [val]: {
          ...boxes[val],
          // resizable expects a percentage (for rooms), whereas non-resizable expects pixels
          width: resizable
            ? (coordinatesBoundary.width * boxes[val].width) / imageDims.width
            : boxes[val].width,
          height: resizable
            ? (coordinatesBoundary.height * boxes[val].height) /
              imageDims.height
            : boxes[val].height,
          top: convertDisplayedCoordToIntrinsic(
            boxes[val].top,
            "height",
            coordinatesBoundary.height
          ),
          left: convertDisplayedCoordToIntrinsic(
            boxes[val].left,
            "width",
            coordinatesBoundary.width
          ),
        },
      }),
      {}
    );

    onChange && onChange(unscaledBoxes);
  }, [
    boxes,
    onChange,
    imageDims,
    resizable,
    coordinatesBoundary.width,
    coordinatesBoundary.height,
  ]);

  useMemo(() => {
    if (!imageDims) return;
    const copy = Object.keys(iconsMap).reduce(
      (acc, val) => ({
        ...acc,
        [val]: {
          ...iconsMap[val],
          width: resizable
            ? (imageDims.width * iconsMap[val].width) /
              coordinatesBoundary.width
            : iconsMap[val].width,
          height: resizable
            ? (imageDims.height * iconsMap[val].height) /
              coordinatesBoundary.height
            : iconsMap[val].height,
          top:
            (imageDims.height * iconsMap[val].top) / coordinatesBoundary.height,
          left:
            (imageDims.width * iconsMap[val].left) / coordinatesBoundary.width,
        },
      }),
      {}
    );

    setBoxes(copy);
  }, [
    coordinatesBoundary.height,
    coordinatesBoundary.width,
    iconsMap,
    imageDims,
    resizable,
  ]);

  const moveBox = useCallback(
    (id: string, left: number, top: number) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
    },
    [boxes]
  );
  const resizeBox = useCallback(
    (id: string) => (dimensions: Dimensions) => {
      const { width, height } = dimensions;
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { width, height },
          },
        })
      );
    },
    [boxes]
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

  return (
    <>
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
        <div
          style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
        >
          {useMemo(
            () =>
              Object.values(otherIcons).map((icon, index) => (
                <>
                  <img
                    key={`${icon.top}-${icon.left}-${icon.url}-${index}`}
                    src={icon.url || DEFAULT_MAP_ICON_URL}
                    style={{
                      position: "absolute",
                      top: `${(100 * icon.top) / coordinatesBoundary.height}%`,
                      left: `${(100 * icon.left) / coordinatesBoundary.width}%`,
                      width: resizable ? `${icon.width}%` : icon.width, //resizable dimensions are in percentages
                      height: resizable ? `${icon.height}%` : icon.width,
                      borderRadius: rounded ? "50%" : "none",
                      ...otherIconsStyle,
                    }}
                    alt={`${icon.url} map icon`}
                    onClick={() =>
                      onOtherIconClick &&
                      icon.title &&
                      onOtherIconClick(icon.title)
                    }
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: `${
                        (100 * icon.top) / coordinatesBoundary.height +
                        icon.height
                      }%`,
                      left: `${
                        (100 * icon.left) / coordinatesBoundary.width +
                        icon.width / 3
                      }%`,
                      width: resizable ? `${icon.width}%` : icon.width, //resizable dimensions are in percentages
                      height: resizable ? `${icon.height}%` : icon.height,
                      borderRadius: rounded ? "50%" : "none",
                      ...otherIconsStyle,
                    }}
                  >
                    {icon.title}
                  </div>
                </>
              )),
            [
              otherIcons,
              coordinatesBoundary.height,
              coordinatesBoundary.width,
              resizable,
              rounded,
              otherIconsStyle,
              onOtherIconClick,
            ]
          )}
        </div>
        {Object.keys(boxes).map((key) => (
          <DraggableSubvenue
            isResizable={resizable}
            key={key}
            id={key}
            imageStyle={iconImageStyle}
            rounded={!!rounded}
            {...boxes[key]}
            onChangeSize={resizeBox(key)}
            lockAspectRatio={lockAspectRatio}
            onDragStart={setDragItemId}
            isSaving={isSaving}
          />
        ))}
      </div>
      {imageDims && interactive && (
        <CustomDragLayer
          snapToGrid={!!snapToGrid}
          rounded={!!rounded}
          iconSize={boxes[Object.keys(boxes)[dragBoxId]]}
        />
      )}
    </>
  );
};
