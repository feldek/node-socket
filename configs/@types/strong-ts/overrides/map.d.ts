/// <reference path="../utils/utils.d.ts" />

interface Map<K, V> {
  has(value: K | (TsOverridesUtils.TExtendedLiteral<K> & {})): boolean;
}

interface ReadonlyMap<K, V> {
  has(value: K | (TsOverridesUtils.TExtendedLiteral<K> & {})): boolean;
}
