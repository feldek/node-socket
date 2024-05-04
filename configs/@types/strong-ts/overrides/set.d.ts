/// <reference path="../utils/utils.d.ts" />

interface Set<T> {
  has(value: T | (TsOverridesUtils.TExtendedLiteral<T> & {})): boolean;
}

interface ReadonlySet<T> {
  has(value: T | (TsOverridesUtils.TExtendedLiteral<T> & {})): boolean;
}
