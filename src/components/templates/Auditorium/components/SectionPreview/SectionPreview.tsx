import React from "react";
import classNames from "classnames";
import { useHistory } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserFriends, faLock } from "@fortawesome/free-solid-svg-icons";

import { DEFAULT_SECTION_PREVIEW_TITLE } from "settings";

import { WithId } from "utils/id";

import { useSectionSeatedUsers } from "hooks/auditoriumSections";

import { UserList } from "components/molecules/UserList";

import { AuditoriumSection } from "types/auditorium";

import "./SectionPreview.scss";

export interface SectionPreviewProps {
  section: WithId<AuditoriumSection>;
  venueId: string;
}

export const SectionPreview: React.FC<SectionPreviewProps> = ({
  section,
  venueId,
}) => {
  const { isLocked, title } = section;

  const history = useHistory();

  const handleClick = () => {
    if (isLocked) {
      // TODO: Show fancy modal, explainig why a person can't access the preveiw
      return;
    }

    history.push(`${history.location.pathname}/section/${section.id}`);
  };

  const seatedUsers = useSectionSeatedUsers(venueId, section.id);
  const seatedUsersCount = seatedUsers.length;

  const containerClasses = classNames("SectionPreview", {
    "SectionPreview--locked": isLocked,
    "SectionPreview--empty": seatedUsersCount === 0,
  });

  return (
    <div className={containerClasses} onClick={handleClick}>
      <div className="SectionPreview__status-icons">
        {isLocked && (
          <FontAwesomeIcon
            icon={faLock}
            size="sm"
            className="SectionPreview__lock-icon"
          />
        )}
      </div>

      <div className="SectionPreview__title">
        {title ?? DEFAULT_SECTION_PREVIEW_TITLE}
      </div>

      <div className="SectionPreview__people-count">
        <FontAwesomeIcon icon={faUserFriends} size="sm" />
        <span className="SectionPreview__people-count-number">
          {seatedUsersCount}
        </span>
      </div>

      <UserList users={seatedUsers} showTitle={false} />
    </div>
  );
};
