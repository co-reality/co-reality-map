import React, { useCallback, useMemo } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserFriends } from "@fortawesome/free-solid-svg-icons";

import { SECTION_PREVIEW_USER_DISPLAY_COUNT } from "settings";

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
  const { recentVenueUsers } = useRecentVenueUsers({ venueName: venue.name });

  const sectionCapacity = getSectionCapacity(venue, section);

  const sectionId = section.id;
  const venueId = venue.id;

  // @debt refactor this into a hook that more efficiently encapsultes the required selector logic + uses selector to memoise
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

  const isFull = seatedUsersCount >= sectionCapacity;
  const isEmpty = seatedUsersCount === 0;

  const userAmountText = isFull
    ? "Full"
    : `${seatedUsersCount}/${sectionCapacity}`;

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
        limit={SECTION_PREVIEW_USER_DISPLAY_COUNT}
        showMoreUsersToggler={false}
        cellClassName="SectionPreview__avatar"
      />
    </div>
  );
};
