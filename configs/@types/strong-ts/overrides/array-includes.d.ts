/// <reference path="../utils/utils.d.ts" />

interface Array<T> {
  includes(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): boolean;
}

interface ReadonlyArray<T> {
  includes(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): boolean;
}
