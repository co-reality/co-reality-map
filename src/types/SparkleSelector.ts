import { RootState } from "store";

export type SparkleSelector<T> = (state: RootState) => T;
