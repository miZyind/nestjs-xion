export function hasValue<T>(obj: T | null | undefined | void): obj is T {
  return typeof obj !== 'undefined' && obj !== null;
}
