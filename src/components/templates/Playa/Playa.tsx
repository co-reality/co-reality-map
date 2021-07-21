import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useParams } from "react-router-dom";
import { Modal, Overlay } from "react-bootstrap";
import Bugsnag from "@bugsnag/js";
import { throttle } from "lodash";

import { IS_BURN } from "secrets";
import {
  DEFAULT_MAP_ICON_URL,
  PLAYA_TEMPLATES,
  PLAYA_VENUE_SIZE,
  PLAYA_VENUE_NAME,
  REFETCH_SCHEDULE_MS,
  DEFAULT_PARTY_NAME,
  PLAYA_WIDTH,
  PLAYA_HEIGHT,
} from "settings";

import firebase from "firebase/app";

import { OnlineStatsData } from "types/OnlineStatsData";
import { UserVideoState } from "types/RelayMessage";
import { User } from "types/User";
import {
  AnyVenue,
  RoomVisibility,
  VenuePlacement,
  VenuePlacementState,
} from "types/venues";

import { WithId } from "utils/id";
// import { updateLocationData } from "utils/userLocation";
import {
  currentVenueSelectorData,
  // orderedVenuesSelector,
} from "utils/selectors";
// import { getCurrentTimeInUTCSeconds } from "utils/time";
import { peopleAttending, peopleByLastSeenIn } from "utils/venue";

import { useInterval } from "hooks/useInterval";
import { useSelector } from "hooks/useSelector";
import { useRecentVenueUsers } from "hooks/users";
import { useSynchronizedRef } from "hooks/useSynchronizedRef";
import { useUser } from "hooks/useUser";
// import { useFirestoreConnect } from "hooks/useFirestoreConnect";

import { DustStorm } from "components/organisms/DustStorm/DustStorm";

import CreateEditPopUp from "components/molecules/CreateEditPopUp/CreateEditPopUp";
import { DonatePopUp } from "components/molecules/DonatePopUp/DonatePopUp";
import SparkleFairiesPopUp from "components/molecules/SparkleFairiesPopUp/SparkleFairiesPopUp";
import { UserList } from "components/molecules/UserList";

import AvatarLayer from "./AvatarLayer";
import { PlayaBackground } from "./PlayaBackground";
import { PlayaIconComponent } from "./PlayaIcon";
// import VenuePreview from "./VenuePreview";
import VideoChatLayer from "./VideoChatLayer";

import "./Playa.scss";

export type MenuConfig = {
  prompt?: string;
  choices?: MenuChoice[];
  onHide?: () => void;
};

type MenuChoice = {
  text: JSX.Element | string;
  onClick: () => void;
};

export type Shout = {
  created_at: number;
  created_by: string;
  text: string;
};

const ZOOM_INCREMENT = 1.2;
const DOUBLE_CLICK_ZOOM_INCREMENT = 1.5;
const WHEEL_ZOOM_INCREMENT_DELTA = 0.05;
const TRACKPAD_ZOOM_INCREMENT_DELTA = 0.02;
const ZOOM_MAX = 3;
const GATE_X = 1416;
const GATE_Y = 3689;
const VENUE_NEARBY_DISTANCE = 250;
const EDGE_MESSAGES = [
  "Some call it the digital trash fence.",
  "Daft Punk plays in an hour!",
  "Perfect spot to watch the digital sunrise!",
  "You may get lonely out here, but you’re never really alone.",
  "The edge of the SparkleVerse, for now...",
  "If you leave there’s no refund on your free ticket! #decommodification",
  "Ask yourself: aren’t we all just MOOP; caught up in the great big trash fence called life?",
  "Tried to write Haiku; you are a brave explorer; SparkleVerse loves you",
  "Why not put up an art piece out here!",
  "Hope you’re enjoying your adventure ❤️",
];
// Let the playa scroll out from under the left donate button, left ranger button, and right chat bar
const PLAYA_MARGIN_X = 75;
// Let the playa scroll out from under the top banners
const PLAYA_MARGIN_TOP = 60;
// Let the playa scroll at the bottom, accounting for navbar padding and zooming the avatar
const PLAYA_MARGIN_BOTTOM = 180;
const VIDEO_CHAT_MIN_HEIGHT = 180;

const isPlaced = (venue: AnyVenue) => {
  return (
    venue &&
    venue.placement &&
    venue.placement.x &&
    venue.placement.y &&
    (venue.placement.state === VenuePlacementState.AdminPlaced ||
      venue.placement.state === VenuePlacementState.SelfPlaced)
  );
};

const minZoom = () => (window.innerWidth - 2 * PLAYA_MARGIN_X) / PLAYA_WIDTH;

const venues = [] as WithId<AnyVenue>[];

const Playa = () => {
  // @debt This will currently load all venues in firebase into memory.. not very efficient
  // useFirestoreConnect("venues");
  // const venues = useSelector(orderedVenuesSelector);

  const venue = useSelector(currentVenueSelectorData);

  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<WithId<AnyVenue>>();
  const [zoom, setZoom] = useState(minZoom());
  const [centerX, setCenterX] = useState(GATE_X);
  const [centerY, setCenterY] = useState(GATE_Y);
  const [myX, setMyX] = useState<number>();
  const [myY, setMyY] = useState<number>();
  const [centeredOnMe, setCenteredOnMe] = useState<boolean>();
  const [meIsLocated, setMeIsLocated] = useState(false);
  const [atEdge, setAtEdge] = useState<boolean>();
  const [atEdgeMessage, setAtEdgeMessage] = useState<string>();
  const playaRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [videoChatHeight, setVideoChatHeight] = useState(
    Math.max(VIDEO_CHAT_MIN_HEIGHT, window.innerHeight / 4)
  );
  const [autoAdjustVideoChatHeight, setAutoAdjustVideoChatHeight] = useState(
    true
  );
  const sliderRef = useRef<HTMLDivElement>(null);
  const [bikeMode, setBikeMode] = useState<boolean | undefined>(true);
  const [videoState, setVideoState] = useState<string>();

  const toggleBikeMode = useCallback(() => {
    setBikeMode(!bikeMode);
  }, [bikeMode]);
  const toggleVideoState = useCallback(() => {
    setVideoState((prev) =>
      prev === UserVideoState.Open ? UserVideoState.Locked : UserVideoState.Open
    );
  }, []);

  const [movingUp, setMovingUp] = useState(false);
  const [movingDown, setMovingDown] = useState(false);
  const [movingLeft, setMovingLeft] = useState(false);
  const [movingRight, setMovingRight] = useState(false);

  const myXRef = useSynchronizedRef(myX);
  const myYRef = useSynchronizedRef(myY);

  const { user, profile } = useUser();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        height: playaRef?.current
          ? playaRef.current.clientHeight
          : window.innerHeight,
        width: playaRef?.current
          ? playaRef.current.clientWidth
          : window.innerWidth,
      });
      setZoom((zoom) => Math.max(minZoom(), zoom));
      if (autoAdjustVideoChatHeight) {
        setVideoChatHeight(
          Math.max(VIDEO_CHAT_MIN_HEIGHT, window.innerHeight / 4)
        );
      }
    };
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  });

  const loadedInitialState = useRef(false);
  useEffect(() => {
    if (!loadedInitialState.current) {
      try {
        const storedState = localStorage.getItem(PLAYA_VENUE_NAME);
        if (storedState) {
          const state = JSON.parse(storedState);
          setZoom(Math.max(minZoom(), Math.min(state.zoom, ZOOM_MAX)));
          setCenterX(state.x);
          setCenterY(state.y);
          loadedInitialState.current = true;
        }
      } catch {}
    }
    localStorage.setItem(
      PLAYA_VENUE_NAME,
      JSON.stringify({ zoom, x: centerX, y: centerY })
    );
  }, [zoom, centerX, centerY, setZoom]);

  useLayoutEffect(() => {
    let dragging = false;
    let movedSoFarX = 0;
    let movedSoFarY = 0;
    let dragStartX = 0;
    let dragStartY = 0;

    const dragStartListener = (event: MouseEvent | TouchEvent) => {
      if (event.which !== 1) {
        return;
      }
      event.preventDefault();
      dragging = true;
      if (event instanceof TouchEvent) {
        dragStartX = event.touches[0].clientX;
        dragStartY = event.touches[0].clientY;
      } else {
        dragStartX = event.clientX;
        dragStartY = event.clientY;
      }
    };
    const pan = throttle((event: MouseEvent | TouchEvent) => {
      // since this function is asynchronous due to throttling, it's possible that dragging is false in moveListener but this is still called
      if (!dragging) return;

      let diffX: number;
      let diffY: number;

      if (event instanceof TouchEvent) {
        diffX = event.touches[0].clientX - dragStartX;
        diffY = event.touches[0].clientY - dragStartY;
      } else {
        diffX = event.clientX - dragStartX;
        diffY = event.clientY - dragStartY;
      }

      setCenterX((tx) =>
        Math.max(0, Math.min(PLAYA_WIDTH, tx - (diffX - movedSoFarX)))
      );
      setCenterY((ty) =>
        Math.max(0, Math.min(PLAYA_HEIGHT, ty - (diffY - movedSoFarY)))
      );

      movedSoFarX = diffX;
      movedSoFarY = diffY;
    }, 25);
    const moveListener = (event: MouseEvent | TouchEvent) => {
      if (dragging && mapRef.current) {
        event.preventDefault();
        pan(event);
      }
    };
    const dragEndListener = (event: MouseEvent | TouchEvent) => {
      if (dragging && mapRef.current) {
        event.preventDefault();
      }

      // reset drag state
      dragStartX = 0;
      dragStartY = 0;
      movedSoFarX = 0;
      movedSoFarY = 0;
      dragging = false;
    };

    const doubleClickListener = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      setZoom((z) => z * DOUBLE_CLICK_ZOOM_INCREMENT);
    };

    const zoomAction = throttle((event: WheelEvent) => {
      const trackpad = event.ctrlKey;
      const delta = Math.sign(event.deltaY) * (trackpad ? -1 : 1);
      setZoom((z) =>
        Math.min(
          Math.max(
            minZoom(),
            z +
              delta *
                (trackpad
                  ? TRACKPAD_ZOOM_INCREMENT_DELTA
                  : WHEEL_ZOOM_INCREMENT_DELTA)
          ),
          ZOOM_MAX
        )
      );
    }, 1);

    // @debt we should try to avoid using event.stopPropagation()
    const zoomListener = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      zoomAction(event);
    };

    if (mapRef.current) {
      mapRef.current.addEventListener("mousedown", dragStartListener);
      mapRef.current.addEventListener("touchstart", dragStartListener, {
        passive: true,
      });
      window.addEventListener("mousemove", moveListener);
      window.addEventListener("touchmove", moveListener);
      window.addEventListener("mouseup", dragEndListener);
      window.addEventListener("touchend", dragEndListener);
      mapRef.current.addEventListener("dblclick", doubleClickListener);
      mapRef.current.addEventListener("wheel", zoomListener);
    }
    const mapRefCurrent = mapRef.current;

    return () => {
      if (mapRefCurrent) {
        mapRefCurrent.removeEventListener("mousedown", dragStartListener);
        mapRefCurrent.removeEventListener("touchstart", dragStartListener);
        window.removeEventListener("mousemove", moveListener);
        window.removeEventListener("touchmove", moveListener);
        window.removeEventListener("mouseup", dragEndListener);
        window.removeEventListener("touchend", dragEndListener);
        mapRefCurrent.removeEventListener("dblclick", doubleClickListener);
        mapRefCurrent.removeEventListener("wheel", zoomListener);
      }
    };
  }, []);

  const showVenue = useCallback(
    (venue: WithId<AnyVenue>) => {
      setSelectedVenue(venue);
      setShowModal(true);
    },
    [setShowModal, setSelectedVenue]
  );

  const hideVenue = useCallback(() => {
    setShowModal(false);
    // user &&
    //   updateLocationData(
    //     user,
    //     { [PLAYA_VENUE_NAME]: getCurrentTimeInUTCSeconds() },
    //     profile?.lastSeenIn
    //   );
  }, [setShowModal]);

  const distanceToVenue = (
    x: number,
    y: number,
    venuePlacement: VenuePlacement | undefined
  ) => {
    if (
      !venuePlacement ||
      venuePlacement.state === VenuePlacementState.Hidden
    ) {
      return;
    }
    return Math.hypot(venuePlacement.x - x, venuePlacement.y - y);
  };

  const { camp } = useParams<{ camp?: string }>();
  useEffect(() => {
    if (camp) {
      const campVenue = venues?.find((venue) => venue.id === camp);
      if (campVenue && !PLAYA_TEMPLATES.includes(campVenue.template)) {
        if (campVenue.placement !== undefined) {
          setCenterX(campVenue.placement.x);
          setCenterY(campVenue.placement.y);
        }
        showVenue(campVenue);
      }
    }
  }, [camp, showVenue]);

  const [openVenues, setOpenVenues] = useState<OnlineStatsData["openVenues"]>();

  useInterval(() => {
    firebase
      .functions()
      .httpsCallable("stats-getLiveAndFutureEvents")()
      .then((result) => {
        const { openVenues } = result.data as OnlineStatsData;
        setOpenVenues(
          profile?.kidsMode
            ? openVenues.filter((v) => !v.venue.adultContent)
            : openVenues
        );
        //setOpenVenues(openVenues);
      })
      .catch(Bugsnag.notify);
  }, REFETCH_SCHEDULE_MS);

  const [showVenueTooltip, setShowVenueTooltip] = useState(false);
  const [hoveredVenue, setHoveredVenue] = useState<AnyVenue>();
  const venueRef = useRef<HTMLDivElement | null>(null);
  const [showUserTooltip, setShowUserTooltip] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>();
  const userRef = useRef<HTMLDivElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menu, setMenu] = useState<MenuConfig>();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [, setRerender] = useState(0);
  const [shoutText, setShoutText] = useState("");

  const shout = useCallback(() => {
    if (!user || !shoutText || !shoutText.length) return;
    const shout: Shout = {
      created_at: new Date().getTime(),
      created_by: user.uid,
      text: shoutText,
    };
    firebase.firestore().collection(`experiences/playa/shouts`).add(shout);
    setShoutText("");
  }, [user, shoutText]);

  // Forces a rerender after `hoveredVenue` and `venueRef` changed
  // Otherwise changing the ref does not trigger a rerender
  // And the Overlay position is always one tick late
  // (next to the previously hovered venue)
  useEffect(() => {
    setRerender((c) => c + 1);
  }, [hoveredVenue]);

  const venueName = venue?.name ?? "";
  const { recentVenueUsers } = useRecentVenueUsers({ venueName });

  // Removed for now as attendance counting is inaccurate and is confusing people
  const users = useMemo(
    () =>
      hoveredVenue &&
      peopleAttending(
        peopleByLastSeenIn(venueName, recentVenueUsers),
        hoveredVenue
      ),
    [recentVenueUsers, hoveredVenue, venueName]
  );

  useEffect(() => {
    setCenteredOnMe(myX === centerX && myY === centerY);
    setAtEdge((atEdge) => {
      const newAtEdge =
        myX !== undefined &&
        myY !== undefined &&
        (myX <= 0 ||
          myX >= PLAYA_HEIGHT - 1 ||
          myY <= 0 ||
          myY >= PLAYA_WIDTH - 1);
      if (!atEdge && newAtEdge) {
        setAtEdgeMessage(
          EDGE_MESSAGES[Math.floor(Math.random() * EDGE_MESSAGES.length)]
        );
      }
      return newAtEdge;
    });
  }, [centerX, centerY, myX, myY]);

  useEffect(() => {
    if (!sliderRef.current) return;

    let dragStartY = 0;
    let movedSoFarY = 0;
    let dragging = false;
    const sliderDragStart = (event: MouseEvent) => {
      setAutoAdjustVideoChatHeight(false);
      dragStartY = event.clientY;
      movedSoFarY = 0;
      dragging = true;
      event.preventDefault();
    };
    const sliderDrag = throttle((event: MouseEvent) => {
      if (!dragging) return;
      const diffY = dragStartY - event.clientY;
      setVideoChatHeight((prev) => {
        const next = Math.max(
          VIDEO_CHAT_MIN_HEIGHT,
          prev + diffY - movedSoFarY
        );
        return next;
      });
      movedSoFarY = diffY;
    }, 25);
    const sliderDragMove = (event: MouseEvent) => {
      if (dragging) {
        event.preventDefault();
        sliderDrag(event);
      }
    };
    const sliderDragEnd = () => {
      dragging = false;
      window.dispatchEvent(new Event("resize"));
    };
    sliderRef.current.addEventListener("mousedown", sliderDragStart);
    window.addEventListener("mousemove", sliderDragMove);
    window.addEventListener("mouseup", sliderDragEnd);

    const sliderRefCurrent = sliderRef.current;
    return () => {
      sliderRefCurrent.removeEventListener("mousedown", sliderDragStart);
      window.removeEventListener("mousemove", sliderDrag);
      window.removeEventListener("mouseup", sliderDragEnd);
    };
  }, [sliderRef]);

  const recenter = useCallback(() => {
    unstable_batchedUpdates(() => {
      if (myXRef.current === undefined || myYRef.current === undefined) return;
      setCenterX(myXRef.current);
      setCenterY(myYRef.current);
    });
  }, [myXRef, myYRef]);

  const getNearbyVenue = useCallback((x: number, y: number) => {
    if (!venues) return;
    let closestVenue: WithId<AnyVenue> | undefined;
    let distanceToClosestVenue: number;
    venues.forEach((venue) => {
      const distance = distanceToVenue(x, y, venue.placement);
      if (
        distance &&
        distance <= VENUE_NEARBY_DISTANCE &&
        (!distanceToClosestVenue || distance < distanceToClosestVenue)
      ) {
        closestVenue = venue;
        distanceToClosestVenue = distance;
      }
    });
    return closestVenue;
  }, []);

  const setMyLocation = useMemo(
    () => (x: number, y: number) => {
      unstable_batchedUpdates(() => {
        setCenterX(x);
        setCenterY(y);
        setMyX(x);
        setMyY(y);
        setMeIsLocated(true);
        const nearbyVenue = getNearbyVenue(x, y);
        if (nearbyVenue) {
          setHoveredVenue(nearbyVenue);
        }
        setShowVenueTooltip(!!nearbyVenue);
      });
    },
    [getNearbyVenue]
  );

  const isUserVenueOwner = user && venue?.owners?.includes(user.uid);

  const inVideoChat = profile && profile.video?.inRoomOwnedBy !== undefined;
  const dustStorm = venue?.dustStorm;

  const changeDustStorm = useCallback(async () => {
    return await firebase.functions().httpsCallable("venue-toggleDustStorm")();
  }, []);

  const numberOfUsers = users?.length ?? 0;
  const selectedVenueId = selectedVenue?.id;

  const playaContent = useMemo(() => {
    const now = new Date().getTime();
    const peopleByLastSeen = peopleByLastSeenIn(venueName, recentVenueUsers);
    return (
      <>
        <PlayaBackground
          nightCycle={venue?.nightCycle}
          backgroundImage={venue?.mapBackgroundImageUrl}
        />
        {venues?.filter(isPlaced).map((v, idx) => {
          // @debt This isn't strictly correct here.. but this is an unused legacy template soon to be deleted, so we don't mind
          const usersInVenue = recentVenueUsers;
          // const usersInVenue = recentVenueUsers.filter(
          //   (partygoer) =>
          //     partygoer.lastSeenIn?.[v.name] >
          //     (nowMs - LOC_UPDATE_FREQ_MS * 2) / 1000
          // );
          return (
            <>
              <div
                className={`venue ${
                  v.width || v.height
                    ? "sized"
                    : (peopleAttending(peopleByLastSeen, v)?.length || 0) > 0 ||
                      !!openVenues?.find(
                        (ov) =>
                          ov.venue.id === v.id &&
                          !!ov.currentEvents.find(
                            (ve) =>
                              now / 1000 >= ve.start_utc_seconds &&
                              now / 1000 <
                                60 * ve.duration_minutes + ve.start_utc_seconds
                          )
                      )
                    ? "live"
                    : ""
                }`}
                style={{
                  top: v.placement?.y || PLAYA_VENUE_SIZE / 2,
                  left: v.placement?.x || PLAYA_VENUE_SIZE / 2,
                  width: v.width ?? PLAYA_VENUE_SIZE,
                  height: v.height ?? PLAYA_VENUE_SIZE,
                  position: "absolute",
                }}
                onClick={() => showVenue(v)}
                key={idx}
                onMouseOver={(event: React.MouseEvent) => {
                  setHoveredVenue(v);
                  venueRef.current = event.target as HTMLDivElement;
                  setShowVenueTooltip(true);
                }}
                onMouseLeave={() => setShowVenueTooltip(false)}
              >
                <span className="img-vcenter-helper" />
                <img
                  className="venue-icon"
                  src={v.mapIconImageUrl || DEFAULT_MAP_ICON_URL}
                  alt={`${v.name} Icon`}
                />

                {selectedVenueId === v.id && <div className="selected" />}
              </div>
              {(venue?.roomVisibility === RoomVisibility.count ||
                venue?.roomVisibility === RoomVisibility.nameCount) && (
                <div
                  style={{
                    top: v.placement?.y
                      ? v.placement?.y - PLAYA_VENUE_SIZE
                      : PLAYA_VENUE_SIZE / 2,
                    left: v.placement?.x ? v.placement?.x : v.width / 2,
                    position: "absolute",
                  }}
                >
                  <div className="playa-venue-text">
                    <div className="playa-venue-maininfo">
                      {venue?.roomVisibility === RoomVisibility.nameCount && (
                        <div className="playa-venue-title">{v?.name}</div>
                      )}
                      <div className="playa-venue-people">
                        {usersInVenue.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })}
        <PlayaIconComponent
          playaIcon={venue?.playaIcon}
          venues={venues}
          showVenue={showVenue}
        />
        <PlayaIconComponent
          playaIcon={venue?.playaIcon2}
          venues={venues}
          showVenue={showVenue}
        />
        {(!venue?.roomVisibility ||
          venue?.roomVisibility === RoomVisibility.hover) && (
          <Overlay
            target={venueRef.current}
            show={showVenueTooltip && !showUserTooltip && !showMenu}
          >
            {({ placement, arrowProps, show: _show, popper, ...props }) => (
              // @ts-expect-error
              <div
                {...props}
                style={{
                  ...props.style,
                  padding: "10px",
                }}
              >
                <div className="playa-venue-text">
                  <div className="playa-venue-maininfo">
                    <div className="playa-venue-title">
                      {hoveredVenue?.name}
                    </div>
                    <div className="playa-venue-people">{numberOfUsers}</div>
                  </div>
                </div>
              </div>
            )}
          </Overlay>
        )}
        <Overlay
          target={userRef.current}
          show={!showVenueTooltip && showUserTooltip && !showMenu}
        >
          {({ placement, arrowProps, show: _show, popper, ...props }) => (
            // @ts-expect-error
            <div {...props} style={{ ...props.style, padding: "10px" }}>
              <div className="playa-venue-text">
                <div className="playa-venue-maininfo">
                  <div className="playa-user-title">
                    {hoveredUser?.anonMode
                      ? DEFAULT_PARTY_NAME
                      : hoveredUser?.partyName}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Overlay>
        <Overlay
          target={menuRef.current}
          show={showMenu}
          rootClose
          onHide={() => {
            if (menu?.onHide) {
              menu.onHide();
            }
            setShowMenu(false);
          }}
        >
          {({ placement, arrowProps, show: _show, popper, ...props }) => (
            // @ts-expect-error
            <div {...props} style={{ ...props.style, padding: "10px" }}>
              <div className="playa-menu">
                <div className="prompt">{menu?.prompt}</div>
                <ul className="choices">
                  {menu?.choices?.map((choice, index) => (
                    <li
                      className="choice"
                      onClick={() => {
                        if (choice.onClick) choice.onClick();
                        document.body.click();
                      }}
                      key={index}
                    >
                      {choice.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Overlay>
      </>
    );
  }, [
    hoveredUser,
    hoveredVenue,
    menu,
    numberOfUsers,
    selectedVenueId,
    showMenu,
    showUserTooltip,
    showVenueTooltip,
    venue,
    openVenues,
    showVenue,
    recentVenueUsers,
    venueName,
  ]);

  const avatarLayer = useMemo(
    () => (
      <AvatarLayer
        useProfilePicture={venue?.profileAvatars ?? true}
        bikeMode={bikeMode}
        setBikeMode={setBikeMode}
        videoState={videoState}
        setVideoState={setVideoState}
        toggleVideoState={toggleVideoState}
        movingUp={movingUp}
        movingDown={movingDown}
        movingLeft={movingLeft}
        movingRight={movingRight}
        setMyLocation={setMyLocation}
        setShowUserTooltip={setShowUserTooltip}
        setHoveredUser={setHoveredUser}
        setShowMenu={setShowMenu}
        setMenu={setMenu}
        userRef={userRef}
        menuRef={menuRef}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      bikeMode,
      videoState,
      movingUp,
      movingDown,
      movingLeft,
      movingRight,
      setMyLocation,
      toggleVideoState,
    ]
  );

  const mapContainer = useMemo(() => {
    const translateX = Math.min(
      PLAYA_MARGIN_X / zoom,
      -1 *
        Math.min(
          (centerX * zoom - dimensions.width / 2) / zoom,
          PLAYA_WIDTH - dimensions.width / zoom + PLAYA_MARGIN_X / zoom
        )
    );
    const translateY = Math.min(
      PLAYA_MARGIN_TOP / zoom,
      -1 *
        Math.min(
          (centerY * zoom - dimensions.height / 2) / zoom,
          PLAYA_HEIGHT - dimensions.height / zoom + PLAYA_MARGIN_BOTTOM / zoom
        )
    );

    return (
      <div
        className="map-container"
        ref={mapRef}
        style={{
          transform: `scale(${zoom}) translate3d(${translateX}px, ${translateY}px, 0)`,
        }}
      >
        {playaContent}
        {avatarLayer}
      </div>
    );
  }, [
    avatarLayer,
    centerX,
    centerY,
    dimensions.width,
    dimensions.height,
    playaContent,
    zoom,
  ]);

  return useMemo(() => {
    return (
      <>
        {atEdge && (
          <div className="playa-banner">
            <>
              <strong>You&apos;re at the edge of the map.</strong>{" "}
              {atEdgeMessage}
            </>
          </div>
        )}

        {IS_BURN && dustStorm && <DustStorm />}

        {recentVenueUsers && (
          <div className="playa-userlist">
            <UserList
              users={recentVenueUsers}
              activity={venue?.activity ?? "partying"}
            />
          </div>
        )}

        <div className="playa-container" ref={playaRef}>
          {mapContainer}
          {meIsLocated && (
            <div className="avatar-controls">
              <div
                className="up"
                onMouseDown={(event) => {
                  setMovingUp(true);
                  event.preventDefault();
                }}
                onTouchStart={(event) => {
                  setMovingUp(true);
                  event.preventDefault();
                }}
                onMouseUp={() => setMovingUp(false)}
                onTouchEnd={() => setMovingUp(false)}
              >
                <div className="btn" />
              </div>
              <div
                className="down"
                onMouseDown={(event) => {
                  setMovingDown(true);
                  event.preventDefault();
                }}
                onTouchStart={(event) => {
                  setMovingDown(true);
                  event.preventDefault();
                }}
                onMouseUp={() => setMovingDown(false)}
                onTouchEnd={() => setMovingDown(false)}
              >
                <div className="btn" />
              </div>
              <div
                className="left"
                onMouseDown={(event) => {
                  setMovingLeft(true);
                  event.preventDefault();
                }}
                onTouchStart={(event) => {
                  setMovingLeft(true);
                  event.preventDefault();
                }}
                onMouseUp={() => setMovingLeft(false)}
                onTouchEnd={() => setMovingLeft(false)}
              >
                <div className="btn" />
              </div>
              <div
                className="right"
                onMouseDown={(event) => {
                  setMovingRight(true);
                  event.preventDefault();
                }}
                onTouchStart={(event) => {
                  setMovingRight(true);
                  event.preventDefault();
                }}
                onMouseUp={() => setMovingRight(false)}
                onTouchEnd={() => setMovingRight(false)}
              >
                <div className="btn" />
              </div>
            </div>
          )}
          <div className="playa-controls">
            {IS_BURN && isUserVenueOwner && (
              <div
                className={`playa-controls-recenter show`}
                onClick={changeDustStorm}
              >
                <div
                  className={`playa-dust-storm-btn${
                    dustStorm ? "-activated" : ""
                  }`}
                />
              </div>
            )}
            <div
              className={`playa-controls-recenter ${
                centeredOnMe === false ? "show" : ""
              }`}
              onClick={recenter}
            >
              <div className="playa-controls-recenter-btn" />
            </div>
            <div className={"playa-controls-bikemode"} onClick={toggleBikeMode}>
              <div
                className={`playa-controls-bikemode-btn ${
                  bikeMode ? "bike" : ""
                }`}
              />
            </div>
            <div className="playa-controls-zoom">
              <div
                className={`playa-controls-zoom-in ${
                  zoom >= ZOOM_MAX ? "disabled" : ""
                }`}
                onClick={() =>
                  setZoom((zoom) => Math.min(zoom * ZOOM_INCREMENT, ZOOM_MAX))
                }
              ></div>
              <div
                className={`playa-controls-zoom-out ${
                  zoom <= minZoom() ? "disabled" : ""
                }`}
                onClick={() =>
                  setZoom((zoom) => Math.max(zoom / ZOOM_INCREMENT, minZoom()))
                }
              ></div>
            </div>
            <div className="playa-controls-shout" onClick={() => shout()}>
              <div className="playa-controls-shout-btn"></div>
            </div>
            <form
              onSubmit={(event) => {
                shout();
                event.preventDefault();
              }}
            >
              <input
                type="text"
                className="playa-controls-shout-text"
                placeholder={`Shout across ${PLAYA_VENUE_NAME}...`}
                value={shoutText}
                onChange={(event) => setShoutText(event.target.value)}
                autoComplete="off"
              />
            </form>
          </div>
          {IS_BURN && (
            <>
              <div className="donate-pop-up">
                <DonatePopUp />
              </div>
              <div className="create-edit-pop-up">
                <CreateEditPopUp />
              </div>
              <div className="sparkle-fairies">
                <SparkleFairiesPopUp />
              </div>
            </>
          )}
        </div>
        <div
          className={`playa-slider ${inVideoChat ? "show" : ""}`}
          ref={sliderRef}
        />
        <div
          className={`playa-videochat ${inVideoChat ? "show" : ""}`}
          style={{ height: videoChatHeight }}
        >
          <VideoChatLayer />
        </div>
        <Modal show={showModal} onHide={hideVenue}></Modal>
      </>
    );
  }, [
    hideVenue,
    showModal,
    bikeMode,
    toggleBikeMode,
    centeredOnMe,
    meIsLocated,
    recenter,
    shout,
    shoutText,
    atEdge,
    atEdgeMessage,
    zoom,
    isUserVenueOwner,
    dustStorm,
    changeDustStorm,
    inVideoChat,
    videoChatHeight,
    mapContainer,
    venue,
    recentVenueUsers,
  ]);
};

export default Playa;
