export function hasKey<K extends PropertyKey>(o: unknown, key: K): o is { [_ in K]: unknown } {
  if (typeof o !== 'object' || o === null) return false;
  return key in o;
}

export const BetterObject: {
  keys<T extends Record<string, unknown>>(object: T): (keyof T)[];
  values<T extends Record<string, unknown>>(Object: T): T[keyof T][];
} = {
  keys: (o) => Object.keys(o) as any,
  values: (o) => Object.values(o) as any,
};

export function isRecord(a: unknown): a is Record<string, unknown> {
  return typeof a === 'object' && a != null;
}
