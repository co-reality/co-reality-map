import { RootState } from "store";
import {
  FirestoreData,
  FirestoreOrdered,
  FirestoreStatus,
} from "types/Firestore";
import { SparkleSelector } from "types/SparkleSelector";

/**
 * Selector to retrieve Firestore 'data' key from Redux.
 *
 * @param state the root Redux store
 */
export const firestoreDataSelector: SparkleSelector<FirestoreData> = (
  state: RootState
) => state.firestore.data;

/**
 * Selector to retrieve Firestore 'ordered' key from Redux.
 *
 * @param state the root Redux store
 */
export const firestoreOrderedSelector: SparkleSelector<FirestoreOrdered> = (
  state: RootState
) => state.firestore.ordered;

/**
 * Selector to retrieve Firestore 'status' key from Redux.
 *
 * @param state the root Redux store
 */
export const firestoreStatusSelector: SparkleSelector<FirestoreStatus> = (
  state: RootState
) => state.firestore.status;

/**
 * Make a selector function for state.firestore.data[key]
 *
 * @param key the key to extract
 */
export const makeDataSelector = <T extends keyof FirestoreData>(key: T) => (
  state: RootState
) => firestoreDataSelector(state)[key];

/**
 * Make a selector function for state.firestore.ordered[key]
 *
 * @param key the key to extract
 */
export const makeOrderedSelector = <T extends keyof FirestoreOrdered>(
  key: T
) => (state: RootState) => firestoreOrderedSelector(state)[key];

/**
 * Make a selector function for state.firestore.status.requesting[key]
 *
 * @param key the key to extract
 */
export const makeIsRequestingSelector = <
  T extends keyof FirestoreStatus["requesting"]
>(
  key: T
) => (state: RootState) => firestoreStatusSelector(state).requesting[key];

/**
 * Make a selector function for state.firestore.status.requested[key]
 *
 * @param key the key to extract
 */
export const makeIsRequestedSelector = <
  T extends keyof FirestoreStatus["requested"]
>(
  key: T
) => (state: RootState) => firestoreStatusSelector(state).requested[key];

/**
 * Make a selector function for state.firestore.status.timestamps[key]
 *
 * @param key the key to extract
 */
export const makeTimestampSelector = <
  T extends keyof FirestoreStatus["timestamps"]
>(
  key: T
) => (state: RootState) => firestoreStatusSelector(state).timestamps[key];
