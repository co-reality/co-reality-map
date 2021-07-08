import { useMemo } from "react";

import { useWorldUsers } from "./useWorldUsers";
import { useUser } from "hooks/useUser";

export const useContactsListToDisplay = () => {
  const { worldUsers } = useWorldUsers();
  const { userWithId } = useUser();

  return useMemo(
    () =>
      worldUsers.filter((recentUser) =>
        userWithId?.contactsList?.includes(recentUser.id)
      ),
    [worldUsers, userWithId?.contactsList]
  );
};
