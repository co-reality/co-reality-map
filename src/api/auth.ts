import firebase from "firebase/app";
import Bugsnag from "@bugsnag/js";

type CheckAccessTypes = {
  venueId: string;
  password?: string;
  email?: string;
  code?: string;
  token?: string;
};

export interface CheckIsEmailWhitelisted {
  venueId: string;
  email: string;
}

export const checkIsEmailWhitelisted = async (data: CheckIsEmailWhitelisted) =>
  await firebase.functions().httpsCallable("access-checkIsEmailWhitelisted")(
    data
  );

export const checkAccess = async (data: CheckAccessTypes) =>
  await firebase.functions().httpsCallable("access-checkAccess")(data);

export interface CustomAuthConfig {
  customAuthName: string;
  customAuthConnectPath: string;
}

export const fetchCustomAuthConfig = async (
  venueId: string
): Promise<CustomAuthConfig> =>
  await firebase
    .functions()
    .httpsCallable("auth-getCustomAuthConfig")({ venueId })
    .then<CustomAuthConfig>((result) => result.data)
    .catch((err) => {
      Bugsnag.notify(err, (event) => {
        event.addMetadata("context", {
          location: "api/auth::fetchCustomAuthConfig",
          venueId,
        });
      });

      throw err;
    });

export const getUsersEmails = async (usersIds: string[]) =>
  await firebase.functions().httpsCallable("auth-getUsersEmailsById")({
    usersIds,
  });
