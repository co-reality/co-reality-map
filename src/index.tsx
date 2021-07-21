import "./wdyr";

import React, { useEffect } from "react";
import { render } from "react-dom";

import LogRocket from "logrocket";
// eslint-disable-next-line no-restricted-imports
import mixpanel from "mixpanel-browser";

import { Provider } from "react-redux";
import { createStore, combineReducers, applyMiddleware, Reducer } from "redux";
import thunkMiddleware from "redux-thunk";
import { createFirestoreInstance, firestoreReducer } from "redux-firestore";
import {
  ReactReduxFirebaseProvider,
  firebaseReducer,
  isLoaded,
  FirebaseReducer,
} from "react-redux-firebase";
import { composeWithDevTools } from "redux-devtools-extension";

import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";
import "firebase/performance";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import {
  BUILD_SHA1,
  LOGROCKET_APP_ID,
  MIXPANEL_PROJECT_TOKEN,
  STRIPE_PUBLISHABLE_KEY,
} from "secrets";
import { FIREBASE_CONFIG } from "settings";

import { VenueTemplateReducers, MiscReducers } from "store/reducers";

import * as serviceWorker from "./serviceWorker";
import { activatePolyFills } from "./polyfills";

import { Firestore } from "types/Firestore";
import { User } from "types/User";

import {
  PerformanceTrace,
  tracePromise,
  traceReactScheduler,
} from "utils/performance";
import { authSelector } from "utils/selectors";

import { CustomSoundsProvider } from "hooks/sounds";
import { useSelector } from "hooks/useSelector";

import { AppRouter } from "components/organisms/AppRouter";

import { LoadingPage } from "components/molecules/LoadingPage/LoadingPage";

import { BugsnagErrorBoundary, addToBugsnagEventOnError } from "bugsnag";

import "scss/global.scss";
import { ThemeProvider } from "styled-components";
import { theme } from "theme/theme";

activatePolyFills();

if (LOGROCKET_APP_ID) {
  LogRocket.init(LOGROCKET_APP_ID, {
    release: BUILD_SHA1,
  });

  addToBugsnagEventOnError((event) => {
    event.addMetadata("logrocket", "sessionUrl", LogRocket.sessionURL);
  });
}

const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
firebaseApp.analytics();
firebaseApp.auth();
firebaseApp.firestore();
const firebaseFunctions = firebase.functions();
firebase.performance();

// Enable the functions emulator when running in development
if (process.env.NODE_ENV === "development") {
  firebaseFunctions.useFunctionsEmulator("http://localhost:5001");
}

// Load Stripe
const stripePromise = tracePromise(PerformanceTrace.initStripeLoad, () =>
  loadStripe(STRIPE_PUBLISHABLE_KEY ?? "")
);

const rrfConfig = {
  userProfile: "users",
  useFirestoreForProfile: true,
};

// Add firebase to reducers
const rootReducer = combineReducers({
  firebase: firebaseReducer as Reducer<FirebaseReducer.Reducer<User>>,
  firestore: firestoreReducer as Reducer<Firestore>,
  ...VenueTemplateReducers,
  ...MiscReducers,
});

export type RootState = ReturnType<typeof rootReducer>;

const initialState = {};
const store = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(
    applyMiddleware(
      thunkMiddleware,
      LogRocket.reduxMiddleware() // logrocket needs to be last
    )
  )
);

export type AppDispatch = typeof store.dispatch;

const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance,
};

if (MIXPANEL_PROJECT_TOKEN) {
  mixpanel.init(MIXPANEL_PROJECT_TOKEN, { batch_requests: true });
}

const AuthIsLoaded: React.FunctionComponent<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const auth = useSelector(authSelector);

  useEffect(() => {
    if (!auth || !auth.uid) return;

    const displayName = auth.displayName || "N/A";
    const email = auth.email || "N/A";

    if (LOGROCKET_APP_ID) {
      LogRocket.identify(auth.uid, {
        displayName,
        email,
      });
    }

    if (MIXPANEL_PROJECT_TOKEN) {
      mixpanel.identify(email);
    }
  }, [auth]);

  if (!isLoaded(auth)) return <LoadingPage />;

  return <>{children}</>;
};

traceReactScheduler("initial render", performance.now(), () => {
  render(
    <BugsnagErrorBoundary>
      <ThemeProvider theme={theme}>
        <Elements stripe={stripePromise}>
          <DndProvider backend={HTML5Backend}>
            <Provider store={store}>
              <ReactReduxFirebaseProvider {...rrfProps}>
                <AuthIsLoaded>
                  <CustomSoundsProvider
                    loadingComponent={<LoadingPage />}
                    waitTillConfigLoaded
                  >
                    <AppRouter />
                  </CustomSoundsProvider>
                </AuthIsLoaded>
              </ReactReduxFirebaseProvider>
            </Provider>
          </DndProvider>
        </Elements>
      </ThemeProvider>
    </BugsnagErrorBoundary>,
    document.getElementById("root")
  );
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
