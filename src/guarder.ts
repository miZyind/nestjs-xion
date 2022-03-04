export function hasValue<T>(v: T | null | undefined | void): v is T {
  return typeof v !== 'undefined' && v !== null;
}

export function getValuable<
  T,
  V = { [K in keyof T as T[K] extends null | undefined ? never : K]: T[K] },
>(entity: T): V {
  return Object.fromEntries(
    Object.entries(entity).filter(([, v]) => hasValue(v)),
  ) as V;
}
