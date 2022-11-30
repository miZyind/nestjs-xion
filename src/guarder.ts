import type { ObjectLiteral } from './type';

export function hasValue<T>(v: T | null | undefined | void): v is T {
  return typeof v !== 'undefined' && v !== null;
}

export function hasValidValue<T extends unknown[] | boolean | number | string>(
  v: T | null | undefined,
): v is T {
  if (typeof v !== 'undefined' && v !== null) {
    if (typeof v === 'string' || Array.isArray(v)) {
      return Boolean(v.length);
    }
    if (typeof v === 'boolean') {
      return v;
    }
  }

  return false;
}

export function getValuable<
  T extends ObjectLiteral,
  V = { [K in keyof T as T[K] extends null | undefined ? never : K]: T[K] },
>(entity: T): V {
  return Object.fromEntries(
    Object.entries(entity).filter(([, v]) => hasValue(v)),
  ) as V;
}
