import React, { useMemo } from "react";
import { faTv, faShare, faStop } from "@fortawesome/free-solid-svg-icons";

import { POSTERPAGE_MAX_VIDEO_PARTICIPANTS, IFRAME_ALLOW } from "settings";

import { PosterPageVenue } from "types/venues";

import { WithId } from "utils/id";

import { useShowHide } from "hooks/useShowHide";
import { useWorldUsers } from "hooks/users";

import { VideoParticipant } from "components/organisms/Video";
import { UserList } from "components/molecules/UserList";
import { PosterCategory } from "components/atoms/PosterCategory";

import { UserProfilePicture } from "components/molecules/UserProfilePicture";

import { IntroVideoPreviewModal } from "./components/IntroVideoPreviewModal";
import { PosterPageControl } from "./components/PosterPageControl";
import { PosterPageSettingsControl } from "./components/PosterPageSettingsControl";
import { ShareModal } from "./components/ShareModal";

import { usePosterVideo } from "./usePosterVideo";

import "./PosterPage.scss";

export interface PosterPageProps {
  venue: WithId<PosterPageVenue>;
}

export const PosterPage: React.FC<PosterPageProps> = ({ venue }) => {
  const { id: venueId, isLive: isPosterLive, poster, iframeUrl } = venue;

  const { title, introVideoUrl, categories, authorName, authors, posterId } =
    poster ?? {};

  const {
    isShown: isIntroVideoShown,

    show: showIntroVideoModal,
    hide: hideIntroVideoModal,
  } = useShowHide();

  const {
    isShown: isShareModalShown,
    show: showShareModal,
    hide: hideShareModal,
  } = useShowHide();

  const {
    activeParticipants,
    passiveListeners,

    isMeActiveParticipant,

    becomePassiveParticipant,
    becomeActiveParticipant,
  } = usePosterVideo(venueId);

  const videoParticipants = useMemo(
    () =>
      activeParticipants.map(({ participant, user }, index) => (
        <VideoParticipant
          key={participant.identity ?? `participant-${index}`}
          participant={participant}
          participantUser={user}
          additionalClassNames="PosterPage__video-participant"
        />
      )),
    [activeParticipants]
  );

  const renderedCategories = useMemo(
    () =>
      Array.from(new Set(categories)).map((category) => (
        <PosterCategory key={category} category={category} active />
      )),
    [categories]
  );

  const hasFreeSpace =
    videoParticipants.length < POSTERPAGE_MAX_VIDEO_PARTICIPANTS;

  const { worldUsers } = useWorldUsers();

  const userPresenter = useMemo<JSX.Element[]>(() => {
    return worldUsers
      .filter((user) => user.partyName === authorName)
      .map((user) => (
        <UserProfilePicture key={`user-${user.id}`} user={user} />
      ));
  }, [worldUsers, authorName]);

  return (
    <div className="PosterPage">
      <div className="PosterPage__header">
        {/* This empty div is needed to properly center the middle cell */}
        <div />

        <div className="PosterPage__header--middle-cell">
          {posterId && <div className="PosterPage__posterId">{posterId}</div>}
          <p className="PosterPage__title">{title}</p>
          <div className="PosterPage__authorBox">
            <div className="PosterPage__avatar">{userPresenter}</div>
            <p className="PosterPage__author">
              {authors?.join(", ") ?? authorName}
            </p>
          </div>
          <div className="PosterPage__categories">{renderedCategories}</div>
        </div>

        <div className="PosterPage__header--right-cell">
          {isMeActiveParticipant && (
            <PosterPageControl
              label="Stop video"
              icon={faStop}
              containerClassNames="PosterPage__control--stop"
              onClick={becomePassiveParticipant}
            />
          )}

          <PosterPageSettingsControl
            isPosterLive={isPosterLive}
            venueId={venueId}
          />

          <PosterPageControl
            label="Share"
            icon={faShare}
            onClick={showShareModal}
          />

          {introVideoUrl && (
            <PosterPageControl
              label="Intro video"
              icon={faTv}
              onClick={showIntroVideoModal}
            />
          )}
        </div>
      </div>

      <div className="PosterPage__content">
        <iframe
          className="PosterPage__iframe"
          src={iframeUrl}
          title={title}
          allow={IFRAME_ALLOW}
          allowFullScreen
        />

        {videoParticipants}

        {hasFreeSpace && !isMeActiveParticipant && (
          <div
            className="PosterPage__join-video-participants-btn"
            onClick={becomeActiveParticipant}
          >
            Join with video
          </div>
        )}
      </div>

      <UserList
        users={passiveListeners}
        activity="listening"
        containerClassName="PosterPage__listeners"
      />

      {introVideoUrl && (
        <IntroVideoPreviewModal
          isVisible={isIntroVideoShown}
          onHide={hideIntroVideoModal}
          introVideoUrl={introVideoUrl}
        />
      )}
      <ShareModal
        show={isShareModalShown}
        onHide={hideShareModal}
        venue={venue}
      />
    </div>
  );
};
