declare namespace TsOverridesUtils {
  type TExcludeFalsy<T> = T extends false | 0 | "" | null | undefined
    ? never
    : T;

  type TExtendedLiteral<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends bigint
          ? bigint
          : T extends symbol
            ? symbol
            : T;
}
