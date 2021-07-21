/* eslint-disable @typescript-eslint/no-explicit-any*/
// eslint-disable-next-line no-restricted-imports
import { TypedUseSelectorHook, useSelector as _useSelector } from "react-redux";
import { RootState } from "store";
import { WithId } from "utils/id";
import { useMemo, useRef } from "react";

export const useSelector: TypedUseSelectorHook<RootState> = _useSelector;

// @debt SubRecordType is only used by withKeyedData / RecordType, can we remove them?
type SubRecordType = Record<string, object>;
// @debt AllOtherTypes is only used by RecordType, can we remove them?
type AllOtherTypes = Array<any> | string | number | boolean;
// @debt RecordType is only used by withKeyedData / useKeyedSelector, can we remove them?
type RecordType = Record<string, AllOtherTypes | SubRecordType>;

// @debt useKeyedSelector doesn't appear to be used anymore, can we remove it?
export const useKeyedSelector = <T extends RecordType, Q extends keyof T>(
  callback: (state: RootState) => T,
  keys: ReadonlyArray<Q>
) => {
  const keysRef = useRef(keys);
  const result = useSelector(callback);
  return useMemo(() => withKeyedData(result, keysRef.current), [result]);
};

// @debt WithKeys seems to only be used by addIdsToObjectValues/WithRootKeysNamed, which only seems to be
//  used by withKeyedData, which is only used be useKeyedSelector, which doesn't appear to be used anymore,
//  can we remove it?
type WithKeys<T extends Record<string, object>> = {
  [K in keyof T]: WithId<T[K]>;
};

// @debt WithRootKeysNamed seems to only be used by withKeyedData, which is only used be useKeyedSelector,
//  which doesn't appear to be used anymore, can we remove it?
type WithRootKeysNamed<T extends Record<string, any>, Names extends string> = {
  [K in keyof T]: K extends Names
    ? T[K] extends Record<string, object>
      ? WithKeys<T[K]>
      : T[K]
    : T[K];
};

// given an object with shape Record<string, object>, this function adds the key of the root object to
// as a property of the value object
// @debt addIdsToObjectValues seems to only be used by withKeyedData, which is only used be useKeyedSelector,
//  which doesn't appear to be used anymore, can we remove it?
const addIdsToObjectValues = <T extends Record<string, object>>(obj: T) =>
  Object.keys(obj).reduce<typeof obj>((acc, k) => {
    const key = k as keyof typeof obj;
    const valueAtKey = obj[key];
    return { ...acc, [key]: { ...valueAtKey, id: key } };
  }, obj) as WithKeys<T>;

// @debt withKeyedData seems to only be used by useKeyedSelector, which doesn't appear to be used anymore, can we remove it?
export const withKeyedData = <T extends RecordType, Q extends keyof T>(
  data: T,
  keys: ReadonlyArray<Q>
) => {
  type Data = Extract<T, RecordType>;
  type DataKeys = ExtractReadonlyArray<typeof keys>;
  type KeyedData = WithRootKeysNamed<Data, Extract<DataKeys, string>>;

  return Object.keys(data).reduce<KeyedData>((acc, k) => {
    const key = k as DataKeys;
    if (keys.includes(key)) {
      const valueAtKey = data[key];
      if (typeof valueAtKey !== "object") return acc;
      type ObjectAtKey = Extract<typeof valueAtKey, SubRecordType>;
      // not sure why type inference does not eliminate non-object types, which is the reason for the cast
      const keyedData = addIdsToObjectValues(valueAtKey as ObjectAtKey);
      return { ...acc, [k]: keyedData };
    }
    return acc;
  }, data as KeyedData);
};

// @debt ExtractReadonlyArray seems to only be used by withKeyedData, which is only used be useKeyedSelector,
//  which doesn't appear to be used anymore, can we remove it?
type ExtractReadonlyArray<T> = T extends ReadonlyArray<infer U> ? U : never;
