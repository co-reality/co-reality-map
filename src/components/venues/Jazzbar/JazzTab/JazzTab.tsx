import React, { useContext, useState, useEffect } from "react";
import { User as FUser } from "firebase";
import { useForm } from "react-hook-form";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeMute, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { TOGGLE_MUTE_REACTIONS } from "actions";
import "./JazzTab.scss";
import "./TableHeader.scss";
import TablesUserList from "components/molecules/TablesUserList";
import { useDispatch, useSelector } from "react-redux";
import { PARTY_NAME } from "config";
import TableComponent from "components/molecules/TableComponent";
import UserList from "components/molecules/UserList";
import Room from "components/organisms/Room";
import { User } from "types/User";
import { JAZZBAR_TABLES } from "./constants";
import {
  ExperienceContext,
  Reactions,
  EmojiReactionType,
  TextReactionType,
  Reaction,
} from "components/context/ExperienceContext";
import CallOutMessageForm from "./CallOutMessageForm";
import TableHeader from "components/molecules/TableHeader";
import TableFooter from "components/molecules/TableFooter";
import { Venue, VenueTemplate } from "pages/VenuePage/VenuePage";

interface PropsType {
  setUserList: (value: User[]) => void;
}

interface ChatOutDataType {
  messageToTheBand: string;
}

export interface JazzbarVenue extends Venue {
  template: VenueTemplate.jazzbar;
  data: {
    iframeUrl: string;
    logoImageUrl: string;
  };
}

const Jazz: React.FunctionComponent<PropsType> = ({ setUserList }) => {
  const dispatch = useDispatch();
  const { experience, user, users, muteReactions, venue } = useSelector(
    (state: any) => ({
      experience:
        state.firestore.data.config?.[PARTY_NAME]?.experiences.jazzbar,
      user: state.user,
      users: state.firestore.ordered.partygoers,
      muteReactions: state.muteReactions,
      venue: state.firestore.data.currentVenue,
    })
  ) as {
    users: User[];
    user: FUser;
    venue: JazzbarVenue;
    muteReactions: boolean;
    experience: any;
  };

  const [isMessageToTheBandSent, setIsMessageToTheBandSent] = useState(false);

  useEffect(() => {
    if (isMessageToTheBandSent) {
      setTimeout(() => {
        setIsMessageToTheBandSent(false);
      }, 2000);
    }
  }, [isMessageToTheBandSent, setIsMessageToTheBandSent]);

  const [isVideoFocused, setIsVideoFocused] = useState(false);
  const experienceContext = useContext(ExperienceContext);

  const [seatedAtTable, setSeatedAtTable] = useState("");

  const usersInJazzBar =
    users &&
    experience &&
    users.filter((user: User) => user.lastSeenIn === venue.name);

  const usersAtSameTable =
    users &&
    users.filter(
      (user: User) =>
        user.data?.[venue.name] && user.data[venue.name].table === seatedAtTable
    );

  const usersInJazzbarWithoutPeopleAtTable =
    users &&
    experience &&
    usersAtSameTable &&
    users.filter(
      (user: User) =>
        usersInJazzBar.includes(user) && !usersAtSameTable.includes(user)
    );

  const usersSeated =
    users &&
    users.filter(
      (user: User) => user.data?.[venue.name] && user.data[venue.name].table
    );

  const usersStanding =
    usersSeated &&
    users.filter(
      (user: User) =>
        user.lastSeenIn === venue.name && !usersSeated.includes(user)
    );

  function createReaction(
    reaction: { reaction: EmojiReactionType },
    user: FUser
  ): Reaction;
  function createReaction(
    reaction: { reaction: TextReactionType; text: string },
    user: FUser
  ): Reaction;
  function createReaction(reaction: any, user: FUser) {
    return {
      created_at: new Date().getTime(),
      created_by: user.uid,
      ...reaction,
    };
  }

  const reactionClicked = (user: FUser, reaction: EmojiReactionType) => {
    experienceContext &&
      experienceContext.addReaction(createReaction({ reaction }, user));
    setTimeout(() => (document.activeElement as HTMLElement).blur(), 1000);
  };

  const { register, handleSubmit, setValue } = useForm<ChatOutDataType>({
    mode: "onSubmit",
  });

  const onSubmit = async (data: ChatOutDataType) => {
    experienceContext &&
      experienceContext.addReaction(
        createReaction(
          { reaction: "messageToTheBand", text: data.messageToTheBand },
          user
        )
      );
    setValue([{ messageToTheBand: "" }]);
    setIsMessageToTheBandSent(true);
  };

  return (
    <div className="scrollable-area">
      <div className="user-interaction-container">
        {users && (
          <UserList
            users={
              seatedAtTable
                ? usersInJazzbarWithoutPeopleAtTable
                : usersInJazzBar
            }
            limit={26}
            activity="in the jazz bar"
          />
        )}
      </div>
      <div
        className={`content ${
          !seatedAtTable ? "jazz-bar-grid" : "jazz-bar-table"
        }`}
      >
        <TablesUserList
          setSeatedAtTable={setSeatedAtTable}
          seatedAtTable={seatedAtTable}
          venueName={venue.name}
          TableComponent={TableComponent}
          joinMessage={true}
          customTables={JAZZBAR_TABLES}
        />

        <div
          className={`jazz-container ${
            !seatedAtTable ? "container-in-grid" : "container-in-row "
          }`}
        >
          <div
            key="main-event-container"
            className={`video ${
              seatedAtTable
                ? isVideoFocused
                  ? "video-focused col-11"
                  : "col-5 video-not-focused"
                : ""
            }`}
          >
            <iframe
              key="main-event"
              title="main event"
              width="100%"
              height="100%"
              className="youtube-video"
              src={`${venue.data.iframeUrl}?autoplay=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;"
            />
            {seatedAtTable && (
              <div className="call-out-band-container-at-table">
                <CallOutMessageForm
                  onSubmit={handleSubmit(onSubmit)}
                  isMessageToTheBandSent={isMessageToTheBandSent}
                  register={register}
                />
              </div>
            )}
          </div>
          <div
            className={`reaction-bar ${
              isVideoFocused ? "video-focused" : "video-not-focused"
            }`}
          >
            {!seatedAtTable && (
              <div className="call-out-band-container">
                <CallOutMessageForm
                  onSubmit={handleSubmit(onSubmit)}
                  isMessageToTheBandSent={isMessageToTheBandSent}
                  register={register}
                />
              </div>
            )}
            <div className="emoji-container">
              {Reactions.map((reaction) => (
                <div className="reaction-container">
                  <button
                    className="reaction"
                    onClick={() => reactionClicked(user, reaction.type)}
                  >
                    <span role="img" aria-label={reaction.ariaLabel}>
                      {reaction.text}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <div
              className="reaction-mute"
              onClick={() => dispatch({ type: TOGGLE_MUTE_REACTIONS })}
            >
              <div className="reaction-mute-text">Reactions:</div>
              <FontAwesomeIcon
                size="lg"
                icon={muteReactions ? faVolumeMute : faVolumeUp}
                color={muteReactions ? "red" : undefined}
              />
            </div>
          </div>
        </div>
        {seatedAtTable && (
          <div className="container-in-row">
            <div
              className={`${
                isVideoFocused ? "col-5" : "col-12"
              } table-container`}
            >
              <TableHeader
                seatedAtTable={seatedAtTable}
                setSeatedAtTable={setSeatedAtTable}
                venueName={venue.name}
              />
              <div className="jazz-wrapper">
                <Room roomName={seatedAtTable} setUserList={setUserList} />
              </div>
              <TableFooter
                isVideoFocused={isVideoFocused}
                setIsVideoFocused={setIsVideoFocused}
              />
            </div>
          </div>
        )}
      </div>
      {!seatedAtTable && (
        <div className="user-interaction-container">
          {usersStanding && (
            <UserList users={usersStanding} limit={26} activity="standing" />
          )}
        </div>
      )}
    </div>
  );
};

export default Jazz;
