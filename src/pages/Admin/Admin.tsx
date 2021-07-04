import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shallowEqual } from "react-redux";
import {
  Link,
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
  useRouteMatch,
} from "react-router-dom";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "firebase/storage";

import { IS_BURN } from "secrets";
import { DEFAULT_VENUE } from "settings";

import { ValidStoreAsKeys } from "types/Firestore";
import { isVenueWithRooms, AnyVenue, VenueEvent } from "types/venues";

import { isTruthyFilter } from "utils/filter";
import { WithId } from "utils/id";
import { makeVenueSelector, orderedVenuesSelector } from "utils/selectors";
import { venueInsideUrl } from "utils/url";
import { canBeDeleted, canHavePlacement, canHaveSubvenues } from "utils/venue";

import { useFirestoreConnect } from "hooks/useFirestoreConnect";
import { useIsAdminUser } from "hooks/roles";
import { useQuery } from "hooks/useQuery";
import { useSelector } from "hooks/useSelector";
import { useShowHide } from "hooks/useShowHide";
import { useUser } from "hooks/useUser";
import { useVenueId } from "hooks/useVenueId";

import WithNavigationBar from "components/organisms/WithNavigationBar";

import AdminDeleteEvent from "./AdminDeleteEvent";
import AdminEventModal from "./AdminEventModal";
import { AdminVenuePreview } from "./AdminVenuePreview";
import EventsComponent from "./EventsComponent";
import VenueDeleteModal from "./Venue/VenueDeleteModal";
import { VenueOwnersModal } from "./VenueOwnersModal";

import "./Admin.scss";

dayjs.extend(advancedFormat);

type VenueListProps = {
  selectedVenueId?: string;
  roomIndex?: number;
};

const VenueList: React.FC<VenueListProps> = ({
  selectedVenueId,
  roomIndex,
}) => {
  // @debt This selector relies on all venues in firebase being loaded into memory.. not very efficient
  const venues = useSelector(orderedVenuesSelector);

  if (!venues) return <>Loading...</>;

  return (
    <>
      <div className="page-container-adminsidebar-title title">My Venues</div>
      <div className="page-container-adminsidebar-top">
        <Link to="/admin/venue/creation" className="btn btn-primary">
          Create a venue
        </Link>
      </div>
      <ul className="page-container-adminsidebar-venueslist">
        {venues.map((venue, index) => (
          <li
            key={index}
            className={`${selectedVenueId === venue.id ? "selected" : ""} ${
              canHaveSubvenues(venue) ? "camp" : ""
            }`}
          >
            <Link to={`/admin/${venue.id}`}>{venue.name}</Link>
            {isVenueWithRooms(venue) && (
              <ul className="page-container-adminsidebar-subvenueslist">
                {venue.rooms?.map((room, idx) => (
                  <li
                    key={idx}
                    className={`${idx === roomIndex ? "selected" : ""}`}
                  >
                    <Link to={`/admin/${venue.id}?roomIndex=${idx}`}>
                      {room.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

type VenueDetailsProps = {
  venueId: string;
  roomIndex?: number;
};

const VenueDetails: React.FC<VenueDetailsProps> = ({ venueId, roomIndex }) => {
  const { url: matchUrl } = useRouteMatch();
  const { pathname: urlPath } = useLocation();

  const venueSelector = useCallback(
    (state) => makeVenueSelector(venueId)(state),
    [venueId]
  );
  const venue = useSelector(venueSelector, shallowEqual);

  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [editedEvent, setEditedEvent] = useState<WithId<VenueEvent>>();

  const adminEventModalOnHide = useCallback(() => {
    setShowCreateEventModal(false);
    setEditedEvent(undefined);
  }, []);

  const adminDeleteEventOnHide = useCallback(() => {
    setShowDeleteEventModal(false);
    setEditedEvent && setEditedEvent(undefined);
  }, []);

  const tabs = useMemo(() => {
    if (!venue) return [];

    return [
      { url: matchUrl, label: "Venue Info" },
      { url: `${matchUrl}/events`, label: "Events" },
      canHavePlacement(venue) && {
        url: `${matchUrl}/placement`,
        label: "Placement & Editing",
      },
    ].filter(isTruthyFilter);
  }, [matchUrl, venue]);

  if (!venue) {
    return <>{"Oops, seems we can't find your venue!"}</>;
  }

  return (
    <>
      <div className="page-container-adminpanel-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.url}
            className={`page-container-adminpanel-tab ${
              urlPath === tab.url ? "selected" : ""
            }`}
          >
            <Link to={tab.url}>{tab.label}</Link>
          </div>
        ))}
      </div>
      <div className="page-container-adminpanel-venuepage">
        <Switch>
          <Route path={`${matchUrl}/events`}>
            <EventsComponent
              venue={venue}
              showCreateEventModal={showCreateEventModal}
              setShowCreateEventModal={setShowCreateEventModal}
              editedEvent={editedEvent}
              setEditedEvent={setEditedEvent}
            />
          </Route>
          <Route path={`${matchUrl}/Appearance`}>
            <>Appearance Component</>
          </Route>
          <Route path={matchUrl}>
            <VenueInfoComponent
              venue={venue}
              roomIndex={roomIndex}
              showCreateEventModal={showCreateEventModal}
              setShowCreateEventModal={setShowCreateEventModal}
              setShowDeleteEventModal={setShowDeleteEventModal}
            />
          </Route>
        </Switch>
      </div>
      <AdminEventModal
        show={showCreateEventModal}
        onHide={adminEventModalOnHide}
        venueId={venueId}
        event={editedEvent}
        template={venue.template}
        setEditedEvent={setEditedEvent}
        setShowDeleteEventModal={setShowDeleteEventModal}
      />
      <AdminDeleteEvent
        show={showDeleteEventModal}
        onHide={adminDeleteEventOnHide}
        venueId={venueId}
        event={editedEvent}
      />
    </>
  );
};

export type VenueInfoComponentProps = {
  venue: WithId<AnyVenue>;
  roomIndex?: number;
  showCreateEventModal: boolean;
  setShowCreateEventModal: Function;
  setShowDeleteEventModal: Function;
  editedEvent?: WithId<VenueEvent>;
  setEditedEvent?: Function;
};

const VenueInfoComponent: React.FC<VenueInfoComponentProps> = ({
  venue,
  roomIndex,
  showCreateEventModal,
  setShowCreateEventModal,
  setShowDeleteEventModal,
}) => {
  const queryParams = useQuery();
  const manageUsers = !!queryParams.get("manageUsers");
  const { push } = useHistory();
  const onManageUsersModalHide = useCallback(() => push({ search: "" }), [
    push,
  ]);
  const history = useHistory();
  const match = useRouteMatch();
  const placementDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientWidth = placementDivRef.current?.clientWidth ?? 0;
    const clientHeight = placementDivRef.current?.clientHeight ?? 0;

    placementDivRef.current?.scrollTo(
      (venue.placement?.x ?? 0) - clientWidth / 2,
      (venue.placement?.y ?? 0) - clientHeight / 2
    );
  }, [venue]);

  const {
    isShown: isDeleteModalVisible,
    show: showDeleteModal,
    hide: hideDeleteModal,
  } = useShowHide();
  const [editedEvent, setEditedEvent] = useState<WithId<VenueEvent>>();

  return (
    <>
      <div className="page-container-adminpanel-content">
        {/* after delete venue becomes {id: string} */}
        {venue.name && (
          <>
            <AdminVenuePreview
              venue={venue}
              containerStyle={{ marginTop: 20 }}
            />
          </>
        )}
      </div>
      <div className="page-container-adminpanel-actions">
        {/* after delete venue becomes {id: string} */}
        {venue.name && (
          <>
            <Link
              to={venueInsideUrl(venue.id)}
              target="_blank"
              rel="noopener noreferer"
              className="btn btn-primary btn-block"
            >
              Visit space
            </Link>
            <Link
              to={`/admin/venue/edit/${venue.id}`}
              className="btn btn-block"
            >
              Edit space
            </Link>
            {canHaveSubvenues(venue) && (
              <Link
                to={`/admin/venue/rooms/${venue.id}`}
                className="btn btn-block"
              >
                Add a Room
              </Link>
            )}
            {isVenueWithRooms(venue) && typeof roomIndex !== "undefined" && (
              <Link
                to={`/admin/venue/rooms/${venue.id}?roomIndex=${roomIndex}`}
                className="btn btn-block"
              >
                Edit Room
              </Link>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                history.push(`${match.url}/events`);
                setShowCreateEventModal(true);
              }}
              style={{ marginBottom: 10, width: "100%" }}
            >
              Create an Event
            </button>
            <Link
              to={{ search: "manageUsers=true" }}
              className="btn btn-block btn-primary"
            >
              Manage Venue Owners
            </Link>
            {typeof roomIndex !== "number" && (
              <div className="page-container-adminpanel-actions__note">
                If you are looking to edit one of your rooms, please select the
                room in the left hand menu
              </div>
            )}
            {canBeDeleted(venue) && (
              <button
                role="link"
                className="btn btn-block btn-danger"
                onClick={showDeleteModal}
              >
                Delete space
              </button>
            )}
          </>
        )}
      </div>
      <VenueDeleteModal
        show={isDeleteModalVisible}
        onHide={hideDeleteModal}
        venue={venue}
      />
      <VenueOwnersModal
        visible={manageUsers}
        onHide={onManageUsersModalHide}
        venue={venue}
      />
      <AdminEventModal
        show={showCreateEventModal}
        onHide={() => {
          setShowCreateEventModal(false);
          setEditedEvent(undefined);
        }}
        venueId={venue.id}
        event={editedEvent}
        template={venue.template}
        setEditedEvent={setEditedEvent}
        setShowDeleteEventModal={setShowDeleteEventModal}
      />
    </>
  );
};

export const Admin: React.FC = () => {
  const { user } = useUser();
  const userId = user?.uid || "";

  const { isAdminUser, isLoading: isAdminUserLoading } = useIsAdminUser(userId);

  // @debt refactor this + related code so as not to rely on using a shadowed 'storeAs' key
  //   this should be something like `storeAs: "venuesOwnedByUser"` or similar
  useFirestoreConnect({
    collection: "venues",
    where: [["owners", "array-contains", userId]],
    storeAs: "venues" as ValidStoreAsKeys, // @debt super hacky, but we're consciously subverting our helper protections
  });

  const venueId = useVenueId();
  const queryParams = useQuery();
  const queryRoomIndexString = queryParams.get("roomIndex");
  const queryRoomIndex = queryRoomIndexString
    ? parseInt(queryRoomIndexString)
    : undefined;

  if (isAdminUserLoading) return <>Loading...</>;
  if (!IS_BURN && !isAdminUser) return <>Forbidden</>;

  if (!user) {
    return <Redirect to={venueInsideUrl(DEFAULT_VENUE)} />;
  }

  return (
    <WithNavigationBar fullscreen>
      <div className="admin-dashboard">
        <div className="page-container page-container_adminview">
          <div className="page-container-adminsidebar">
            <VenueList selectedVenueId={venueId} roomIndex={queryRoomIndex} />
          </div>
          <div className="page-container-adminpanel">
            {venueId ? (
              <VenueDetails venueId={venueId} roomIndex={queryRoomIndex} />
            ) : (
              <>Select a venue to see its details</>
            )}
          </div>
        </div>
      </div>
    </WithNavigationBar>
  );
};
