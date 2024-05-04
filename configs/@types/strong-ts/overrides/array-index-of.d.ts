/// <reference path="../utils/utils.d.ts" />

interface Array<T> {
  lastIndexOf(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): number;
  indexOf(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): number;
}

interface ReadonlyArray<T> {
  lastIndexOf(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): number;
  indexOf(
    searchElement: T | (TsOverridesUtils.TExtendedLiteral<T> & {}),
    fromIndex?: number,
  ): number;
}
