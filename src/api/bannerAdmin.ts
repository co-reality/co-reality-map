import Bugsnag from "@bugsnag/js";
import firebase from "firebase/app";

import { Banner } from "types/banner";

export interface MakeUpdateBannerProps {
  venueId: string;
  banner?: Banner;
}

export const makeUpdateBanner = async ({
  venueId,
  banner,
}: MakeUpdateBannerProps): Promise<void> => {
  const params = {
    venueId,
    banner: banner ?? firebase.firestore.FieldValue.delete(),
  };

  await firebase
    .functions()
    .httpsCallable("venue-adminUpdateBannerMessage")(params)
    .catch((err) =>
      Bugsnag.notify(err, (event) => {
        event.addMetadata("api/bannerAdmin::makeUpdateBanner", {
          venueId,
          banner,
        });
      })
    );
};
