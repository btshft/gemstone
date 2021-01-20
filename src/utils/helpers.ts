import { TObject } from './utility.types';

export function reverse<T>(source: T[]): T[] {
  const result = [...source];
  return result.reverse();
}

export function compact<T extends TObject>(source: T): T {
  const copy = { ...source };
  Object.keys(copy).forEach((k) => copy[k] == null && delete copy[k]);
  return copy;
}

export function indexed<T>(values: T[]): { index: number; value: T }[] {
  return values.map((v, i) => ({ index: i, value: v }));
}
