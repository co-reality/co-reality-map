import firebase from "firebase/app";
import { Banner } from "types/banner";

export interface makeUpdateBannerProps {
  venueId: string;
  banner?: Banner;
}

export const makeUpdateBanner = async ({
  venueId,
  banner,
}: makeUpdateBannerProps): Promise<void> => {
  const params = {
    venueId,
    banner: banner ?? firebase.firestore.FieldValue.delete(),
  };

  await firebase.functions().httpsCallable("venue-adminUpdateBannerMessage")(
    params
  );
};
