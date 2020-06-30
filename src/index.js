import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import { createStore, compose, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { reduxFirestore, createFirestoreInstance } from "redux-firestore";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/analytics";
import "firebase/auth";
import "firebase/functions";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import { composeWithDevTools } from "redux-devtools-extension/developmentOnly";

import "bootstrap";
import "scss/global.scss";

import AppRouter from "components/organisms/AppRouter";

import rootReducer from "./reducers/";
import trackingMiddleware from "./middleware/tracking";
import { API_KEY, APP_ID, MEASUREMENT_ID, BUCKET_URL } from "./secrets";
import * as serviceWorker from "./serviceWorker";

const firebaseConfig = {
  apiKey: API_KEY,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID,
  projectId: "co-reality-map",
  storageBucket: BUCKET_URL,
};
const rfConfig = {}; // optional redux-firestore Config Options

const rrfConfig = {
  userProfile: "users",
  useFirestoreForProfile: true,
};

firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
firebase.auth();

if (window.location.hostname === "localhost") {
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
} else {
  firebase.functions();
}

const createStoreWithFirebase = compose(reduxFirestore(firebase, rfConfig))(
  createStore
);

const initialState = {};
const store = createStoreWithFirebase(
  rootReducer,
  initialState,
  composeWithDevTools(
    applyMiddleware(thunkMiddleware, trackingMiddleware(analytics))
  )
);

const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance,
};

render(
  <Provider store={store}>
    <ReactReduxFirebaseProvider {...rrfProps}>
      <AppRouter />
    </ReactReduxFirebaseProvider>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
