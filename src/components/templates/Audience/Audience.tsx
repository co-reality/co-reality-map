import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import classNames from "classnames";

import {
  IFRAME_ALLOW,
  REACTION_TIMEOUT,
  DEFAULT_AUDIENCE_COLUMNS_NUMBER,
  DEFAULT_AUDIENCE_ROWS_NUMBER,
} from "settings";

import { addReaction } from "store/actions/Reactions";

import { makeUpdateUserGridLocation } from "api/profile";

import { GenericVenue } from "types/venues";

import { ConvertToEmbeddableUrl } from "utils/ConvertToEmbeddableUrl";
import { WithId } from "utils/id";
import { createTextReaction } from "utils/reactions";
import { isDefined } from "utils/types";

import { useDispatch } from "hooks/useDispatch";
import { useRecentVenueUsers } from "hooks/users";
import { useUser, useUserInvalidateCache } from "hooks/useUser";
import { useShowHide } from "hooks/useShowHide";

import { usePartygoersbySeat } from "components/templates/PartyMap/components/Map/hooks/usePartygoersBySeat";

import { UserProfilePicture } from "components/molecules/UserProfilePicture";
import { ReactionsBar } from "components/molecules/ReactionsBar";

import "./Audience.scss";

interface ChatOutDataType {
  text: string;
}

// If you change the name of these properties, make sure to also change it in Audience.scss
const SEAT_SIZE = "var(--seat-size)";
const SEAT_SIZE_MIN = "var(--seat-size-min)";

const VIDEO_MIN_WIDTH_IN_SEATS = 8;
// We should keep the 16/9 ratio
const VIDEO_MIN_HEIGHT_IN_SEATS = VIDEO_MIN_WIDTH_IN_SEATS * (9 / 16);

// The seat grid is designed so we can dynamically add rows and columns around the outside when occupancy gets too high.
// That way we never run out of digital seats.
// How the seat grid works:
// Left-most column is -1*Math.floor(COLUMNS/2)
// Right-most column is Math.floor(COLUMNS/2)
// Always have an odd number of columns
// Column zero has no seats, this is our virtual fire lane.

// Example row:
// -4 -3 -2 -1  0  1  2  3  4
// Consumed by video (5/9) = +/- Math.floor(9/4) = [-2,2]
// -4 -3  V  V  V  V  V  3  4

// Example: if 17 columns, Math.ceil(17/2) = 9 of them are not available to leave room for the video.

// The same logic applies to the rows.

// capacity(n) = (((DEFAULT_COLUMNS_NUMBER-1)+2n) * (DEFAULT_ROWS_NUMBER+2n) * 0.75
// Columns decreases by one because of the digital fire lane.
// The video is 50% x 50% so it takes up 1/4 of the seats.
// Because both DEFAULT_COLUMNS_NUMBER-1 and DEFAULT_ROWS_NUMBER are both even, we don't need Math.floor to guarantee integer result..
// And we always add row above&below and a column left&right
// So auditorium size 1 has 1 extra outlined row and column around its outside versus auditorium size 0.
// The same is true for auditorium size 2 - it has an extra row and column around it versus auditorium size 1.

// Example:

// size 0
//
//   s s s s s s s s . s s s s s s s s
//   s s s s s s s s . s s s s s s s s
//   s s s s s s s s . s s s s s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s . . . . . . . . . s s s s
//   s s s s s s s s . s s s s s s s s
//   s s s s s s s s . s s s s s s s s
//   s s s s s s s s . s s s s s s s s

// size 1
//
//   s s s s s s s s s . s s s s s s s s s
//   s s s s s s s s s . s s s s s s s s s
//   s s s s s s s s s . s s s s s s s s s
//   s s s s s s s s s . s s s s s s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s . . . . . . . . . . . s s s s
//   s s s s s s s s s . s s s s s s s s s
//   s s s s s s s s s . s s s s s s s s s
//   s s s s s s s s s . s s s s s s s s s

// But it takes up the same amount of space.

const capacity = (auditoriumSize: number, columns: number, rows: number) =>
  (columns - 1 + auditoriumSize * 2) * (rows + auditoriumSize * 2) * 0.75;

// Never let the auditorium get more than 80% full
const requiredAuditoriumSize = (
  occupants: number,
  columns: number,
  rows: number
) => {
  let size = 0;
  while (size < 10 && capacity(size, columns, rows) * 0.8 < occupants) {
    size++;
  }
  return size;
};

export interface AudienceProps {
  venue: WithId<GenericVenue>;
}

// Note: This is the component that is used for the Auditorium
export const Audience: React.FC<AudienceProps> = ({ venue }) => {
  const venueId = venue.id;

  const { userId, userWithId } = useUser();
  const { recentVenueUsers } = useRecentVenueUsers({ venueName: venue.name });

  const baseColumns =
    venue?.auditoriumColumns ?? DEFAULT_AUDIENCE_COLUMNS_NUMBER;
  const baseRows = venue?.auditoriumRows ?? DEFAULT_AUDIENCE_ROWS_NUMBER;

  const { isShown: isUserAudioOn, toggle: toggleUserAudio } = useShowHide(true);

  const isUserAudioMuted = !isUserAudioOn;

  const [iframeUrl, setIframeUrl] = useState("");
  useLayoutEffect(() => {
    if (!venue) return;

    setIframeUrl(ConvertToEmbeddableUrl(venue.iframeUrl, true));
  }, [venue]);

  const [hasAlreadyFocussed, setAlreadyFocussed] = useState(false);
  const focusElementOnLoad = useCallback(
    (ref: HTMLDivElement | null) => {
      if (ref && !hasAlreadyFocussed) {
        ref.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "center",
        });

        setAlreadyFocussed(true);
      }
    },
    [hasAlreadyFocussed]
  );

  const dispatch = useDispatch();

  // @debt This should probably be all rolled up into a single canonical component. Possibly CallOutMessageForm by the looks of things?
  const [isShoutSent, setIsShoutSent] = useState(false);

  // @debt This should probably be all rolled up into a single canonical component. Possibly CallOutMessageForm by the looks of things?
  useEffect(() => {
    if (isShoutSent) {
      setTimeout(() => {
        setIsShoutSent(false);
      }, REACTION_TIMEOUT);
    }
  }, [isShoutSent, setIsShoutSent]);

  const { register, handleSubmit, reset } = useForm<ChatOutDataType>({
    mode: "onSubmit",
  });

  // Auditorium size 0 is DEFAULT_COLUMNS_NUMBER x DEFAULT_ROWS_NUMBER
  // Size 1 is (DEFAULT_ROWS_NUMBER*2) x (DEFAULT_COLUMNS_NUMBER+2)
  // Size 2 is (DEFAULT_ROWS_NUMBER*4) x (DEFAULT_COLUMNS_NUMBER+4) and so on
  const [auditoriumSize, setAuditoriumSize] = useState(0);

  // These are going to be translated (ie. into negative/positive per above)
  // That way, when the audience size is expanded these people keep their seats

  const seatedVenueUsers = useMemo(() => {
    if (!venueId) return [];

    return recentVenueUsers.filter((user) => {
      const { row, column } = user.data?.[venueId] ?? {};
      return isDefined(row) && isDefined(column);
    });
  }, [recentVenueUsers, venueId]);

  const { partygoersBySeat } = usePartygoersbySeat({
    venueId,
    partygoers: seatedVenueUsers,
  });

  const seatedVenueUsersCount = seatedVenueUsers.length;

  useEffect(() => {
    setAuditoriumSize(
      requiredAuditoriumSize(seatedVenueUsersCount, baseColumns, baseRows)
    );
  }, [baseColumns, baseRows, seatedVenueUsersCount]);

  const rowsForSizedAuditorium = baseRows + auditoriumSize * 2;
  const columnsForSizedAuditorium = baseColumns + auditoriumSize * 2;

  // We use 3 because 1/3 of the size of the auditorium, and * 2 because we're calculating in halves due to using cartesian coordinates + Math.abs
  const carvedOutWidthInSeats = Math.max(
    Math.ceil(columnsForSizedAuditorium / (3 * 2)),
    VIDEO_MIN_WIDTH_IN_SEATS
  );

  // Keep a 16:9 ratio
  const carvedOutHeightInSeats = Math.max(
    Math.ceil(carvedOutWidthInSeats * (9 / 16)),
    VIDEO_MIN_HEIGHT_IN_SEATS
  );

  // Calculate the position/size for the central video container
  const videoContainerWidthInSeats = carvedOutWidthInSeats * 2 + 1;
  const videoContainerHeightInSeats = carvedOutHeightInSeats * 2 + 1;

  const videoContainerStyles = useMemo(
    () => ({
      width: `calc(${videoContainerWidthInSeats} * ${SEAT_SIZE})`,
      height: `calc(${videoContainerHeightInSeats} * ${SEAT_SIZE})`,
      minWidth: `calc(${videoContainerWidthInSeats} * ${SEAT_SIZE_MIN})`,
      minHeight: `calc(${videoContainerHeightInSeats} * ${SEAT_SIZE_MIN})`,
    }),
    [videoContainerHeightInSeats, videoContainerWidthInSeats]
  );

  const isSeat = useCallback(
    (translatedRow: number, translatedColumn: number) => {
      const isInFireLaneColumn = translatedColumn === 0;
      if (isInFireLaneColumn) return false;

      const isInVideoRow = Math.abs(translatedRow) <= carvedOutHeightInSeats;
      const isInVideoColumn =
        Math.abs(translatedColumn) <= carvedOutWidthInSeats;

      const isInVideoCarveOut = isInVideoRow && isInVideoColumn;

      return !isInVideoCarveOut;
    },
    [carvedOutWidthInSeats, carvedOutHeightInSeats]
  );

  const { invalidateUserCache } = useUserInvalidateCache(userId);

  const takeSeat = useCallback(
    (row: number | null, column: number | null) => {
      if (!venueId || !userId) return;

      makeUpdateUserGridLocation({
        venueId,
        userId,
      })(row, column).then(() => invalidateUserCache());
    },
    [venueId, userId, invalidateUserCache]
  );

  const leaveSeat = useCallback(() => {
    takeSeat(null, null);
  }, [takeSeat]);

  // @debt this return useMemo antipattern should be rewritten
  return useMemo(() => {
    // @debt This should probably be all rolled up into a single canonical component. Possibly CallOutMessageForm by the looks of things?
    const onSubmit = async (data: ChatOutDataType) => {
      if (!venueId || !userWithId) return;

      setIsShoutSent(true);

      dispatch(
        addReaction({
          venueId,
          reaction: createTextReaction(data.text, userWithId),
        })
      );

      reset();
    };

    if (!venue || !userWithId || !venueId) return null;

    const userSeated =
      typeof userWithId.data?.[venueId]?.row === "number" &&
      typeof userWithId.data?.[venueId]?.row === "number";

    const translateRow = (untranslatedRowIndex: number) =>
      untranslatedRowIndex - Math.floor(rowsForSizedAuditorium / 2);

    const translateColumn = (untranslatedColumnIndex: number) =>
      untranslatedColumnIndex - Math.floor(columnsForSizedAuditorium / 2);

    const reactionContainerClassnames = classNames("reaction-container", {
      seated: userSeated,
    });

    // @debt This should probably be all rolled up into a single canonical component for emoji reactions/etc
    const renderReactionsContainer = () => (
      <>
        <ReactionsBar
          venueId={venueId}
          leaveSeat={leaveSeat}
          isReactionsMuted={isUserAudioMuted}
          toggleMute={toggleUserAudio}
        />

        {venue.showShoutouts && (
          //  @debt This should probably be all rolled up into a single canonical component. Possibly CallOutMessageForm by the looks of things?
          <div className="shout-container">
            <form onSubmit={handleSubmit(onSubmit)} className="shout-form">
              <input
                name="text"
                className="text"
                placeholder="Shout out to the crowd"
                ref={register({ required: true })}
                disabled={isShoutSent}
                autoComplete="off"
              />
              <input
                className={`shout-button ${isShoutSent ? "btn-success" : ""} `}
                type="submit"
                id={`send-shout-out-${venue.name}`}
                value={isShoutSent ? "Sent!" : "Send"}
                disabled={isShoutSent}
              />
            </form>
          </div>
        )}
      </>
    );

    const renderInstructions = () => (
      <div className="instructions">
        Welcome! Click on an empty seat to claim it!
      </div>
    );

    return (
      <>
        <div
          className="audience-container"
          style={{
            backgroundImage: venue.mapBackgroundImageUrl
              ? `url(${venue.mapBackgroundImageUrl})`
              : undefined,
          }}
        >
          <div className="audience">
            <div className="audience-overlay">
              <div
                ref={focusElementOnLoad}
                className="video-container"
                style={videoContainerStyles}
              >
                <div className="video">
                  <iframe
                    className="frame"
                    src={iframeUrl}
                    title="Video"
                    frameBorder="0"
                    allow={IFRAME_ALLOW}
                    allowFullScreen
                  />
                </div>

                {venue.showReactions && (
                  <div className={reactionContainerClassnames}>
                    {userSeated
                      ? renderReactionsContainer()
                      : renderInstructions()}
                  </div>
                )}
              </div>
            </div>

            {/* @debt can we refactor this to re-use useMapGrid, MapCell, usePartygoersOverlay, MapPartygoerOverlay, usePartygoersbySeat, etc? */}
            {Array.from(Array(rowsForSizedAuditorium)).map(
              (_, untranslatedRowIndex) => {
                const row = translateRow(untranslatedRowIndex);
                return (
                  <div key={untranslatedRowIndex} className="seat-row">
                    {Array.from(Array(columnsForSizedAuditorium)).map(
                      (_, untranslatedColumnIndex) => {
                        const column = translateColumn(untranslatedColumnIndex);
                        const isOnRight = column >= 0;
                        const seat = isSeat(row, column);

                        const seatedPartygoer = partygoersBySeat?.[row]?.[
                          column
                        ]
                          ? partygoersBySeat[row][column]
                          : null;

                        return (
                          <div
                            key={untranslatedColumnIndex}
                            className={seat ? "seat" : "not-seat"}
                            onClick={() =>
                              seat &&
                              seatedPartygoer === null &&
                              takeSeat(row, column)
                            }
                          >
                            {seat && seatedPartygoer && (
                              <UserProfilePicture
                                user={seatedPartygoer}
                                reactionPosition={isOnRight ? "left" : "right"}
                                miniAvatars={venue.miniAvatars}
                                isAudioEffectDisabled={isUserAudioMuted}
                                showNametags={venue.showNametags}
                              />
                            )}
                            {seat && !seatedPartygoer && <>+</>}
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </>
    );
  }, [
    venue,
    userWithId,
    venueId,
    focusElementOnLoad,
    videoContainerStyles,
    iframeUrl,
    rowsForSizedAuditorium,
    dispatch,
    reset,
    columnsForSizedAuditorium,
    isUserAudioMuted,
    toggleUserAudio,
    leaveSeat,
    handleSubmit,
    register,
    isShoutSent,
    isSeat,
    partygoersBySeat,
    takeSeat,
  ]);
};
