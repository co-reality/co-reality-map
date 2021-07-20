import { useFirestoreConnect } from "./useFirestoreConnect";
// import { useSelector } from "hooks/useSelector";

export const useConnectVenueEvents = (venueId?: string) => {
  useFirestoreConnect(
    venueId
      ? [
          {
            collection: "venues",
            doc: venueId,
            subcollections: [{ collection: "events" }],
            orderBy: ["start_utc_seconds", "asc"],
            storeAs: "events",
          },
        ]
      : []
  );
  // return useSelector((state) => state.firestore.ordered.events);
};
