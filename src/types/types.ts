export type TNoOverlap<Base, Extra> = keyof Base & keyof Extra extends never
  ? Extra
  : never;

export type TMergeBaseExtra<
  T extends Record<string, object>,
  E extends Partial<Record<keyof T, object>>,
  K extends keyof T,
  M extends object,
> = (Omit<E, K> & { [P in K]: E[K] & M }) & Partial<Record<keyof T, object>>;

export type TPromiseOrNot<T> = Promise<T> | T;

export type TContinueWith<T> = {
  status: "continue";
  data: T;
  compensate?: (payload: any) => void | Promise<void>;
};

export type TErrorMessage<T> =
  | TContinueWith<T>
  | { status: "stop"; reason?: T }
  | { status: "error"; error: unknown };
