import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserFriends } from "@fortawesome/free-solid-svg-icons";

import { AuditoriumVenue } from "types/venues";
import { AuditoriumSection } from "types/auditorium";

import { WithId } from "utils/id";
import { getAuditoriumSeatedUsers, getSectionCapacity } from "utils/auditorium";

import { useRecentVenueUsers } from "hooks/users";

import { UserList } from "components/molecules/UserList";

import "./SectionPreview.scss";

export interface SectionPreviewProps {
  section: WithId<AuditoriumSection>;
  venue: WithId<AuditoriumVenue>;
  enterSection: (sectionId: string) => void;
}

export const SectionPreview: React.FC<SectionPreviewProps> = ({
  section,
  venue,
  enterSection,
}) => {
  const { recentVenueUsers } = useRecentVenueUsers();

  const maxUsers = getSectionCapacity(venue, section);

  const sectionId = section.id;
  const venueId = venue.id;

  const seatedUsers = useMemo(
    () =>
      getAuditoriumSeatedUsers({
        auditoriumUsers: recentVenueUsers,
        venueId,
        sectionId,
      }),
    [recentVenueUsers, venueId, sectionId]
  );

  const seatedUsersCount = seatedUsers.length;

  const isFull = seatedUsersCount >= maxUsers;
  const isEmpty = seatedUsersCount === 0;

  const userAmountText = isFull ? "Full" : `${seatedUsersCount}/${maxUsers}`;

  const onSectionEnter = useCallback(() => {
    if (isFull) return;

    enterSection(sectionId);
  }, [isFull, enterSection, sectionId]);

  const containerClasses = classNames("SectionPreview", {
    "SectionPreview--full": isFull,
    "SectionPreview--empty": isEmpty,
    "SectionPreview--vip": section.isVip,
  });

  return (
    <div className={containerClasses} onClick={onSectionEnter}>
      {section.isVip && <div className="SectionPreview__vip-label">VIP</div>}

      <div className="SectionPreview__people-count">
        <FontAwesomeIcon icon={faUserFriends} size="sm" />
        <span className="SectionPreview__people-count-number">
          {userAmountText}
        </span>
      </div>

      <UserList
        users={seatedUsers}
        showTitle={false}
        limit={14}
        showMoreUsersToggler={false}
        hasClickableAvatars={false}
        cellClassName="SectionPreview__avatar"
      />
    </div>
  );
};