import React, { useCallback, useState } from "react";
import { useAsync } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import { AnyVenue } from "types/venues";

import { fetchCustomAuthConfig } from "api/auth";

import { WithId } from "utils/id";
import { tracePromise } from "utils/performance";
import { isDefined } from "utils/types";
import { openUrl } from "utils/url";

import { useSAMLSignIn } from "hooks/useSAMLSignIn";
import { useSovereignVenue } from "hooks/useSovereignVenue";

import { InitialForm } from "components/organisms/AuthenticationModal/InitialForm";
import LoginForm from "components/organisms/AuthenticationModal/LoginForm";
import PasswordResetForm from "components/organisms/AuthenticationModal/PasswordResetForm";
// import RegisterForm from "components/organisms/AuthenticationModal/RegisterForm";

import { LoadingPage } from "components/molecules/LoadingPage";

import SAMLLoginIcon from "assets/icons/saml-login-icon.png";

// @debt move all styles into `Login.scss`;
import "./Account.scss";
import "./Login.scss";

export interface LoginProps {
  formType?: "initial" | "login" | "register" | "passwordReset";
  venue: WithId<AnyVenue>;
}

export const Login: React.FC<LoginProps> = ({
  formType = "initial",
  venue,
}) => {
  const venueId = venue.id;
  const { sovereignVenue } = useSovereignVenue({ venueId });
  const [formToDisplay, setFormToDisplay] = useState(formType);

  const { signInWithSAML, hasSamlAuthProviderId, isSigningIn } = useSAMLSignIn({
    samlAuthProviderId: sovereignVenue?.samlAuthProviderId,
  });

  const {
    loading: isCustomAuthConfigLoading,
    value: customAuthConfig,
  } = useAsync(async () => {
    return tracePromise(
      "Login::fetchCustomAuthConfig",
      () => fetchCustomAuthConfig(venueId),
      {
        attributes: {
          venueId,
        },
        withDebugLog: true,
      }
    );
  }, [venueId]);

  const { customAuthName, customAuthConnectPath } = customAuthConfig ?? {};

  const hasCustomAuthConnect = isDefined(customAuthConnectPath);
  const signInWithCustomAuth = useCallback(() => {
    openUrl(
      `${customAuthConnectPath}?venueId=${venueId}&returnOrigin=${window.location.origin}`
    );
  }, [customAuthConnectPath, venueId]);

  const hasAlternativeLogins = hasSamlAuthProviderId || hasCustomAuthConnect;

  const displayLoginForm = () => {
    setFormToDisplay("login");
  };

  const displayRegisterForm = () => {
    setFormToDisplay("register");
  };

  const displayPasswordResetForm = () => {
    setFormToDisplay("passwordReset");
  };

  const redirectAfterLogin = () => {};

  if (isCustomAuthConfigLoading || isSigningIn) return <LoadingPage />;

  return (
    <div className="auth-container">
      <div className="hero-logo github-plain" />
      <div className="auth-form-container">
        {hasAlternativeLogins && (
          <div className="Login__login-box">
            <span>Quick log in with Okta</span>

            <button className="Login__alternative-logins">
              {hasCustomAuthConnect && (
                <img
                  className="Login__quick-login-icon"
                  src={SAMLLoginIcon}
                  onClick={signInWithCustomAuth}
                  title={customAuthName}
                  alt={customAuthName}
                />
              )}
              {hasSamlAuthProviderId && (
                <FontAwesomeIcon
                  className="Login__quick-login-icon"
                  icon={faGithub}
                  size="4x"
                  onClick={signInWithSAML}
                  title="SAML SSO login"
                />
              )}
            </button>
          </div>
        )}
        {/* @debt Changed for Okta SSO */}
        {["initial", "register"].includes(formToDisplay) && (
          <InitialForm
            displayLoginForm={displayLoginForm}
            displayRegisterForm={displayRegisterForm}
          />
        )}
        {/* @debt Removed for Okta SSO */}
        {/*{formToDisplay === "register" && (*/}
        {/*  <RegisterForm*/}
        {/*    displayLoginForm={displayLoginForm}*/}
        {/*    displayPasswordResetForm={displayPasswordResetForm}*/}
        {/*    afterUserIsLoggedIn={redirectAfterLogin}*/}
        {/*    closeAuthenticationModal={() => null}*/}
        {/*  />*/}
        {/*)}*/}
        {formToDisplay === "login" && (
          <LoginForm
            displayRegisterForm={displayRegisterForm}
            displayPasswordResetForm={displayPasswordResetForm}
            closeAuthenticationModal={() => null}
            afterUserIsLoggedIn={redirectAfterLogin}
          />
        )}
        {formToDisplay === "passwordReset" && (
          <PasswordResetForm
            displayLoginForm={displayLoginForm}
            closeAuthenticationModal={redirectAfterLogin}
          />
        )}
      </div>
      <p className="Login__issues-text">
        Trouble registering? Find help at:{" "}
        <strong>#summit-21-registration</strong> or email events@github.com
      </p>
    </div>
  );
};

export default Login;
