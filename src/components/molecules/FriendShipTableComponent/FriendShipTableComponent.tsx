import React from "react";
import { TableComponentPropsType } from "types/Table";
import { User } from "types/User";

const FriendShipTableComponent: React.FunctionComponent<TableComponentPropsType> = ({
  users,
  onJoinClicked,
  nameOfVideoRoom,
  experienceName,
  imageSize = 35,
  setSelectedUserProfile,
  table,
  tableLocked,
  usersAtTables,
}) => {
  const locked = tableLocked(
    table.reference || table.title || "",
    usersAtTables
  );
  const usersSeatedAtTable = users.filter(
    (u: User) =>
      u.data &&
      u.data[experienceName] &&
      (u.data[experienceName].table === table.reference ||
        u.data[experienceName].table === table.title)
  );
  const full = table.capacity && table.capacity === usersSeatedAtTable.length;
  return (
    <>
      <div
        style={{
          gridColumn: table.columns,
          gridRow: table.rows,
        }}
      >
        <div className="table-item-container">
          <div className="table-item">
            <div className="title-container">
              {table.title && <div className="table-title">{table.title}</div>}
              {table.subtitle && (
                <div className="table-subtitle">{table.subtitle}</div>
              )}
            </div>
            <div
              className={`table-occupancy-information ${
                locked || full ? "red-text" : "green-text"
              }`}
            >
              {locked ? (
                "locked"
              ) : full ? (
                "full"
              ) : (
                <div
                  className="join-text"
                  onClick={() =>
                    onJoinClicked(
                      table.reference || table.title || "",
                      locked,
                      nameOfVideoRoom
                    )
                  }
                >
                  open
                </div>
              )}
            </div>
            {usersSeatedAtTable.map((user: User) => (
              <img
                onClick={() => setSelectedUserProfile(user)}
                key={user.id}
                className="profile-icon table-participant-picture"
                src={user.pictureUrl || "/anonymous-profile-icon.jpeg"}
                title={user.partyName}
                alt={`${user.partyName} profile`}
                width={imageSize}
                height={imageSize}
              />
            ))}
            {table.capacity &&
              [...Array(table.capacity - usersSeatedAtTable.length)].map(
                (e, i) => (
                  <span
                    onClick={() =>
                      onJoinClicked(
                        table.reference || table.title || "",
                        locked,
                        nameOfVideoRoom
                      )
                    }
                    className="add-participant-button"
                  >
                    +
                  </span>
                )
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FriendShipTableComponent;
