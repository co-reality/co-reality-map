import { configureStore, combineReducers, Reducer } from "@reduxjs/toolkit";
import {
  FirebaseReducer,
  firebaseReducer,
  getFirebase,
  actionTypes as reactReduxFirebaseActionTypes,
} from "react-redux-firebase";
import {
  firestoreReducer,
  constants as reduxFirestoreConstants,
} from "redux-firestore";
import LogRocket from "logrocket";

import { Firestore } from "types/Firestore";
import { UserWithLocation } from "types/User";

import { worldUsersApi } from "./api";
import { MiscReducers, VenueTemplateReducers } from "./reducers";

export const rootReducer = combineReducers({
  firebase: firebaseReducer as Reducer<
    FirebaseReducer.Reducer<UserWithLocation>
  >,
  firestore: firestoreReducer as Reducer<Firestore>,
  ...VenueTemplateReducers,
  ...MiscReducers,
  [worldUsersApi.reducerPath]: worldUsersApi.reducer,
});

export const initialState: Readonly<{}> = {};

/**
 * Configure the Redux store along with any associated middleware, enhancers, etc.
 *
 * @see https://redux-toolkit.js.org/api/configureStore
 */
export const store = configureStore({
  /**
   * @see https://redux-toolkit.js.org/api/configureStore#reducer
   */
  reducer: rootReducer,

  /**
   * @see https://redux-toolkit.js.org/api/configureStore#preloadedstate
   */
  preloadedState: initialState,

  /**
   * Note: As TypeScript often widens array types when combining arrays using the spread operator, we suggest using the
   * .concat(...) and .prepend(...) methods of the MiddlewareArray returned by getDefaultMiddleware() instead of the array
   * spread operator, as the latter can lose valuable type information under some circumstances.
   *
   * @see https://redux-toolkit.js.org/api/configureStore#middleware
   * @see https://redux-toolkit.js.org/api/getDefaultMiddleware
   * @see https://redux-toolkit.js.org/api/getDefaultMiddleware#customizing-the-included-middleware
   * @see https://redux-toolkit.js.org/usage/usage-with-typescript#correct-typings-for-the-dispatch-type
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * @see https://redux-toolkit.js.org/api/serializabilityMiddleware
       * @see https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
       * @see https://redux-toolkit.js.org/usage/usage-guide#use-with-react-redux-firebase
       */
      serializableCheck: {
        ignoredActions: [
          // Ignore all react-redux-firebase action types
          ...Object.keys(reactReduxFirebaseActionTypes).map(
            (type) => `@@reactReduxFirebase/${type}`
          ),

          // Ignore all redux-firestore action types
          ...Object.keys(reduxFirestoreConstants.actionTypes).map(
            (type) => `${reduxFirestoreConstants.actionsPrefix}/${type}`
          ),
        ],

        // Ignore all react-redux-firebase and redux-firestore data stored in Redux
        ignoredPaths: ["firebase", "firestore"],
      },

      thunk: {
        /**
         * @see https://github.com/reduxjs/redux-thunk#injecting-a-custom-argument
         */
        extraArgument: {
          getFirebase,
        },
      },
    })
      .concat(worldUsersApi.middleware)
      .concat(
        /**
         * Note: LogRocket middleware needs to be last to be able to capture everything correctly
         * (though if we want to add middleware profiling checks, they should probably be after LogRocket)
         *
         * @see https://docs.logrocket.com/reference#customizing-reduxmiddleware
         */
        LogRocket.reduxMiddleware() as ReturnType<typeof getDefaultMiddleware>
        // reduxMiddlewareTiming
      ),

  /**
   * @see https://redux-toolkit.js.org/api/configureStore#devtools
   */
  devTools: true,
});

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
