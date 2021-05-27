import firebase from "firebase/app";
import { BannerFormData } from "types/banner";

export const makeUpdateBanner = (venueId: string) => async (
  data: BannerFormData
): Promise<void> => {
  const params = {
    venueId,
    banner: data,
  };

  await firebase.functions().httpsCallable("venue-adminUpdateBannerMessage")(
    params
  );
};
