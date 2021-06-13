import firebase from "firebase/app";
import { BannerFormData } from "types/banner";

export const makeUpdateBanner = async ({
  venueId,
  banner,
}: {
  venueId: string;
  banner: BannerFormData;
}): Promise<void> => {
  const params = {
    venueId,
    banner,
  };

  await firebase.functions().httpsCallable("venue-adminUpdateBannerMessage")(
    params
  );
};
