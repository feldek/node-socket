/// <reference path="../utils/utils.d.ts" />

interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): TsOverridesUtils.TExcludeFalsy<T>[];
}

interface ReadonlyArray<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): TsOverridesUtils.TExcludeFalsy<T>[];
}
