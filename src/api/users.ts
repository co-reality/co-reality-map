import firebase from "firebase/app";

import { UserWithLocation } from "types/User";

import { WithId } from "utils/id";

export const fetchUsersRecord = async (): Promise<
  Record<string, WithId<UserWithLocation>>
> =>
  firebase
    .firestore()
    .collection("users")
    .get()
    .then((snapshot) => {
      const users: Record<string, WithId<UserWithLocation>> = {};

      snapshot.forEach((doc: firebase.firestore.QueryDocumentSnapshot) => {
        const user: WithId<UserWithLocation> = doc.data() as WithId<UserWithLocation>;
        user.id = doc.id;
        users[doc.id] = user;
      });

      return users;
    });
