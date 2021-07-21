import React, { useCallback, useMemo } from "react";

import { User } from "types/User";
import { WithId } from "utils/id";
// import { isCompleteUser } from "utils/user";
import Table from "react-bootstrap/Table";

import { DEFAULT_PARTY_NAME } from "settings";

interface EmailInterface {
  email: string;
  uid: string;
}

interface AdminUsersTableChartProps {
  users: readonly WithId<User>[];
  emails: EmailInterface[];
}

export const AdminUsersTableChart: React.FC<AdminUsersTableChartProps> = ({
  users,
  emails,
}) => {
  const getUserRowEmail = useCallback(
    (id: string) => {
      return emails.find((email) => email.uid === id)?.email ?? "";
    },
    [emails]
  );

  const getUsersDetails = useMemo(() => {
    return users.map((user: WithId<User>, index) => {
      return (
        <tr key={"AdminUsersReport__table__row__" + user.id}>
          <td>{user.partyName ?? DEFAULT_PARTY_NAME}</td>
          <td>{getUserRowEmail(user.id)}</td>
        </tr>
      );
    });
  }, [users, getUserRowEmail]);

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Party Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>{getUsersDetails}</tbody>
    </Table>
  );
};
