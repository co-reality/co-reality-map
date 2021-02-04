import React from "react";
import { TableComponentPropsType } from "types/Table";
import { DEFAULT_PARTY_NAME, DEFAULT_PROFILE_IMAGE } from "settings";
import { useSelector } from "hooks/useSelector";
import { currentVenueSelectorData } from "utils/selectors";

import "./JazzBarTableComponent.scss";

// @debt THIS COMPONENT IS THE COPY OF components/molecules/TableComponent
// The reason to copy this was the lack of time to refactor the whole thing, so the
// safest approch (not to break other Venues that rely on TableComponent) is to copy this component
// It needs to get deleted in the future
const TableComponent: React.FunctionComponent<TableComponentPropsType> = ({
  users,
  onJoinClicked,
  nameOfVideoRoom,
  experienceName,
  imageSize = 50,
  setSelectedUserProfile,
  table,
  tableLocked,
}) => {
  const venue = useSelector(currentVenueSelectorData);
  const locked = tableLocked(table.reference);
  const usersSeatedAtTable = users.filter(
    (u) => u.data?.[experienceName]?.table === table.reference
  );
  const numberOfSeatsLeft =
    table.capacity && table.capacity - usersSeatedAtTable.length;
  const full = numberOfSeatsLeft === 0;
  return (
    <div className={`jazzbar-table-component-container ${table.reference}`}>
      <div className="table-item">
        <div className="table-occupancy-information red-text">
          {locked ? "locked" : full ? "full" : ""}
        </div>
        <div className="table-number">{table.title}</div>

        {usersSeatedAtTable &&
          usersSeatedAtTable.length >= 0 &&
          usersSeatedAtTable.map((user) => (
            <img
              onClick={() => setSelectedUserProfile(user)}
              key={user.id}
              className="profile-icon table-participant-picture"
              src={(!user.anonMode && user.pictureUrl) || DEFAULT_PROFILE_IMAGE}
              title={(!user.anonMode && user.partyName) || DEFAULT_PARTY_NAME}
              alt={`${
                (!user.anonMode && user.partyName) || DEFAULT_PARTY_NAME
              } profile`}
              width={imageSize}
              height={imageSize}
            />
          ))}
        {usersSeatedAtTable &&
          table.capacity &&
          table.capacity - usersSeatedAtTable.length >= 0 &&
          [...Array(table.capacity - usersSeatedAtTable.length)].map((e, i) => (
            <span
              key={i}
              onClick={() =>
                onJoinClicked(table.reference, locked, nameOfVideoRoom)
              }
              id={`join-table-${venue?.name}-${table.reference}`}
              className="add-participant-button"
            >
              +
            </span>
          ))}
      </div>
    </div>
  );
};

export default TableComponent;
