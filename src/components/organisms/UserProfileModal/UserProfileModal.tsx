import React, { useMemo } from "react";
import { Modal } from "react-bootstrap";
import { useUser } from "hooks/useUser";

import "./UserProfileModal.scss";
import Chatbox from "../Chatbox";
import { User } from "types/User";
import { useSelector } from "hooks/useSelector";
import { WithId } from "utils/id";
import { venueInsideUrl, venuePreviewUrl } from "utils/url";
import { isCampVenue } from "types/CampVenue";
import { Link } from "react-router-dom";
import {
  ENABLE_SUSPECTED_LOCATION,
  PLAYA_VENUE_NAME,
  RANDOM_AVATARS,
} from "settings";
import { useFirestoreConnect } from "react-redux-firebase";
import { AnyVenue } from "types/Firestore";
import { CampRoomData } from "types/CampRoomData";
import { IS_BURN } from "secrets";
import { venuesOrderedSelector } from "utils/selectors";

type fullUserProfile =
  | { userProfile?: WithId<User> }
  | { userProfile?: User; userProfileId?: string };

type PropTypes = {
  show: boolean;
  onHide: () => void;
  zIndex?: number;
} & fullUserProfile;

const UserProfileModal: React.FunctionComponent<PropTypes> = ({
  show,
  onHide,
  zIndex,
  ...rest
}) => {
  const { venue } = useSelector((state) => ({
    venue: state.firestore.data.currentVenue,
  }));

  const { user } = useUser();

  const fullUserProfile = useMemo(() => {
    if (undefined === rest.userProfile) {
      return undefined;
    }

    if ("id" in rest.userProfile) {
      return rest.userProfile;
    }

    if ("userProfileId" in rest && rest.userProfileId) {
      return { ...rest.userProfile, id: rest.userProfileId };
    }
    return undefined;
  }, [rest]);

  if (!fullUserProfile || !fullUserProfile.id || !user) {
    return <></>;
  }

  // REVISIT: remove the hack to cast to any below
  return (
    <Modal show={show} onHide={onHide} style={zIndex && { zIndex }}>
      <Modal.Body>
        <div className="modal-container modal-container_profile">
          <div className="profile-information-container">
            <div className="profile-basics">
              <div className="profile-pic">
                <img
                  src={fullUserProfile.pictureUrl || "/default-profile-pic.png"}
                  alt="profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src =
                      "/avatars/" +
                      RANDOM_AVATARS[
                        Math.floor(
                          fullUserProfile.id.charCodeAt(0) %
                            RANDOM_AVATARS.length
                        )
                      ];
                  }}
                />
              </div>
              <div className="profile-text">
                <h2 className="italic">
                  {fullUserProfile.partyName || "Captain Party"}
                </h2>
              </div>
            </div>
            <div className="profile-extras">
              {venue?.profile_questions?.map((question) => (
                <React.Fragment key="question.text">
                  <p className="light question">{question.text}</p>
                  <h6>
                    {/*
                    // @debt typing - need to support known User interface with unknown question keys
                    // @ts-ignore */}
                    {fullUserProfile[question.name] || //@debt typing - look at the changelog, was this a bug?
                      "I haven't edited my profile to tell you yet"}
                  </h6>
                </React.Fragment>
              ))}
            </div>
            {ENABLE_SUSPECTED_LOCATION && (
              <div className="profile-location">
                <p className="question">Suspected Location:</p>
                <h6 className="location">
                  <SuspectedLocation user={fullUserProfile} />
                </h6>
              </div>
            )}
          </div>
          {IS_BURN && <Badges user={fullUserProfile} />}
          {fullUserProfile.id !== user.uid && (
            <div className="private-chat-container">
              <Chatbox isInProfileModal discussionPartner={fullUserProfile} />
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

const Badges: React.FC<{ user: WithId<User> }> = ({ user }) => {
  useFirestoreConnect([
    {
      collection: "users",
      doc: user.id,
      subcollections: [{ collection: "visits" }],
      storeAs: "userModalVisits",
    },
  ]);
  const visits = useSelector(
    (state) => state.firestore.ordered.userModalVisits
  );
  const venues = useSelector(venuesOrderedSelector);

  const playaTime = useMemo(() => {
    if (!visits) return undefined;

    const playaSeconds = visits.reduce((acc, v) => acc + v.timeSpent, 0);
    const playaHours = Math.floor(playaSeconds / (60 * 60));
    return playaHours > 1 ? `${playaHours}` : "< 1";
  }, [visits]);

  const venuesVisited = useMemo(() => {
    if (!visits) return undefined;
    return visits.filter((visit) => visit.id !== PLAYA_VENUE_NAME).length; // Playa does not count
  }, [visits]);

  const badges = useMemo(() => {
    if (!visits || !venues) return [];
    return visits
      .filter((visit) => visit.id !== PLAYA_VENUE_NAME) // no badge for the Playa. Also does not have a logo
      .map((visit) => {
        const { venue, room } = findVenueAndRoomByName(visit.id, venues);
        if (!venue) return undefined;

        if (room) {
          return {
            venue,
            room,
            image: room.image_url,
            label: room.title,
          };
        }

        return {
          venue,
          image: venue.mapIconImageUrl,
          label: venue.name,
        };
      })
      .filter((b) => b !== undefined);
  }, [visits, venues]);

  if (!visits) {
    return <>Visit venues to collect badges!</>;
  }

  return (
    <>
      <div className="visits">
        <div className="visit-item">
          <span className="visit-item__value">{playaTime} hrs</span>
          <span className="visit-item__label">spent in SparkleVerse</span>
        </div>
        <div className="separator"></div>
        <div className="visit-item">
          <span className="visit-item__value">{venuesVisited}</span>
          <span className="visit-item__label">venues visited</span>
        </div>
      </div>
      <div className="badges-container">
        <div className="badges-title">{badges.length} badges</div>
        <ul className="badge-list">
          {badges.map(
            (b) =>
              b && (
                <li className="badge-list-item" key={b.label}>
                  <Link to={getLocationLink(b.venue, b.room)}>
                    <img
                      className="badge-list-item-image"
                      src={b.image}
                      alt={`${b.label} badge`}
                    />
                  </Link>
                </li>
              )
            // label missing on hover - similar to playa
          )}
        </ul>
      </div>
    </>
  );
};

const findVenueAndRoomByName = (
  nameOrRoomTitle: string,
  venues: Array<WithId<AnyVenue>>
) => {
  const venue = venues.find(
    (v) =>
      v.name === nameOrRoomTitle ||
      (isCampVenue(v) && v.rooms.find((r) => r.title === nameOrRoomTitle))
  );

  if (!venue) return {};

  if (venue.name === nameOrRoomTitle) return { venue };

  return {
    venue,
    room:
      isCampVenue(venue) &&
      venue.rooms.find((r) => r.title === nameOrRoomTitle),
  };
};

const getLocationLink = (venue: WithId<AnyVenue>, room?: CampRoomData) => {
  if (venue.name === PLAYA_VENUE_NAME) {
    return venueInsideUrl(venue.id);
  }

  if (room) {
    return venuePreviewUrl(venue.id, room.title);
  }

  return venueInsideUrl(venue.id);
};

const SuspectedLocation: React.FC<{ user: WithId<User> }> = ({ user }) => {
  useFirestoreConnect("venues");
  const { venues, venue } = useSelector((state) => ({
    venues: state.firestore.ordered.venues,
    venue: state.firestore.data.currentVenue,
  }));

  const suspectedLocation = useMemo(
    () => ({
      venue: venues?.find(
        (v) =>
          (user.lastSeenIn && user.lastSeenIn[venue?.name ?? ""]) ||
          v.name === user.room
      ),
      camp: venues?.find(
        (v) => isCampVenue(v) && v.rooms.find((r) => r.title === user.room)
      ),
    }),
    [user, venues, venue]
  );

  if (!user.room || !venues) {
    return <></>;
  }

  if (suspectedLocation.venue) {
    return (
      <Link to={venueInsideUrl(suspectedLocation.venue.id)}>
        {suspectedLocation.venue.name}
      </Link>
    );
  }
  if (suspectedLocation.camp) {
    return (
      <Link to={venuePreviewUrl(suspectedLocation.camp.id, user.room)}>
        Room {user.room}, in camp {suspectedLocation.camp.name}
      </Link>
    );
  }
  return <>This burner has gone walkabout. Location unguessable</>;
};

export default UserProfileModal;
