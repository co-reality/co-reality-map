import React, { useCallback, useState } from "react";
import { Modal } from "react-bootstrap";
import "./AuthenticationModal.scss";
import { InitialForm } from "./InitialForm";
import LoginForm from "./LoginForm";
import PasswordResetForm from "./PasswordResetForm";
import RegisterForm from "./RegisterForm";

export enum AuthOptions {
  login = "login",
  register = "register",
  passwordReset = "passwordReset",
  initial = "initial",
}

export interface AuthenticationModalProps {
  show: boolean;
  onHide?: () => void;
  afterUserIsLoggedIn?: () => void;
  showAuth: AuthOptions;
}

export const AuthenticationModal: React.FunctionComponent<AuthenticationModalProps> = ({
  show,
  onHide,
  afterUserIsLoggedIn,
  showAuth,
}) => {
  const [formToDisplay, setFormToDisplay] = useState(showAuth);

  const displayLoginForm = useCallback(() => {
    setFormToDisplay(AuthOptions.login);
  }, []);

  const displayRegisterForm = useCallback(() => {
    setFormToDisplay(AuthOptions.register);
  }, []);

  const displayPasswordResetForm = useCallback(() => {
    setFormToDisplay(AuthOptions.passwordReset);
  }, []);

  const closeAuthenticationModal = useCallback(() => {
    setFormToDisplay(showAuth);
    onHide && onHide();
  }, [onHide, showAuth]);

  return (
    <Modal show={show} onHide={closeAuthenticationModal}>
      <div className="authentication-modal-container">
        {formToDisplay === "initial" && (
          <InitialForm
            displayLoginForm={displayLoginForm}
            displayRegisterForm={displayRegisterForm}
          />
        )}
        {formToDisplay === "register" && (
          <RegisterForm
            displayLoginForm={displayLoginForm}
            displayPasswordResetForm={displayPasswordResetForm}
            afterUserIsLoggedIn={afterUserIsLoggedIn}
            closeAuthenticationModal={closeAuthenticationModal}
          />
        )}
        {formToDisplay === "login" && (
          <LoginForm
            displayRegisterForm={displayRegisterForm}
            displayPasswordResetForm={displayPasswordResetForm}
            closeAuthenticationModal={closeAuthenticationModal}
            afterUserIsLoggedIn={afterUserIsLoggedIn}
          />
        )}
        {formToDisplay === "passwordReset" && (
          <PasswordResetForm
            displayLoginForm={displayLoginForm}
            closeAuthenticationModal={closeAuthenticationModal}
          />
        )}
      </div>
    </Modal>
  );
};

/**
 * @deprecated use named export instead
 */
export default AuthenticationModal;
