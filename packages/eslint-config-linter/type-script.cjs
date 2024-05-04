const path = require("node:path");
const rulesdirPlugin = require("eslint-plugin-rulesdir");

rulesdirPlugin.RULES_DIR = path.resolve(__dirname, "rules");

module.exports = {
  "extends": [
    "./index.cjs",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/strict-type-checked",
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint",
    "rulesdir",
  ],
  "rules": {
    // off
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/no-implied-eval": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "@typescript-eslint/interface-name-prefix": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-misused-promises": 0,

    // todo check & enable (update eslint rules to v6)
    "@typescript-eslint/no-unnecessary-type-assertion": 0,
    "@typescript-eslint/no-unnecessary-condition": 0,
    "@typescript-eslint/no-duplicate-type-constituents": 0,
    "@typescript-eslint/unified-signatures": 0,
    "@typescript-eslint/no-dynamic-delete": 0,
    "@typescript-eslint/no-useless-constructor": 0,
    "@typescript-eslint/prefer-literal-enum-member": 0,
    "@typescript-eslint/prefer-ts-expect-error": 0,
    "@typescript-eslint/no-extraneous-class": 0,
    "@typescript-eslint/no-confusing-void-expression": 0,
    "@typescript-eslint/prefer-reduce-type-parameter": 0,
    "@typescript-eslint/no-unnecessary-type-arguments": 0,
    "@typescript-eslint/no-meaningless-void-operator": 0,
    "@typescript-eslint/no-invalid-void-type": 0,
    "@typescript-eslint/no-unsafe-enum-comparison": 0,
    "@typescript-eslint/no-unsafe-declaration-merging": 0,
    "@typescript-eslint/no-redundant-type-constituents": 0,
    "@typescript-eslint/only-throw-error": 0,
    "@typescript-eslint/use-unknown-in-catch-callback-variable": 0,

    // warn
    "@typescript-eslint/ban-ts-comment": [
      1,
      {
        "ts-expect-error": true,
        "ts-ignore": true,
        "ts-nocheck": true,
        "ts-check": false,
      }
    ],
    "@typescript-eslint/ban-types": [
      1,
      {
        extendDefaults: true,
        types: {
          TImplicitAny: {
            message: [
              'The `TImplicitAny` type is a type alias for `any`.',
              '- If you want a type meaning "any value", you probably want `TExplicitAny` in explicit cases or `unknown` instead.',
            ].join('\n'),
          },
        },
      },
    ],
    "@typescript-eslint/no-empty-interface": 1,
    "@typescript-eslint/no-unsafe-argument": 1,
    "@typescript-eslint/no-explicit-any": 1,
    "@typescript-eslint/no-base-to-string": 1,
    "@typescript-eslint/no-non-null-assertion": 1,
    "@typescript-eslint/no-throw-literal": 1,

    // error
    "@typescript-eslint/restrict-plus-operands": 2,
    "@typescript-eslint/no-floating-promises": 2,
    "@typescript-eslint/require-await": 2,
    "@typescript-eslint/no-unused-vars": [2, { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-empty-function": [
      2,
      {
        allow: ["methods", "generatorMethods", "getters", "setters", "constructors", "asyncMethods"],
      },
    ],
    "@typescript-eslint/member-delimiter-style": [
      2,
      {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: true,
        },
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      2,
      {
        prefer: "type-imports",
        disallowTypeAnnotations: true,
        fixStyle: "inline-type-imports",
      }
    ],
    "@typescript-eslint/consistent-type-exports": [2, { fixMixedExportsWithInlineTypeSpecifier: true }],
    "@typescript-eslint/restrict-template-expressions": [
      2,
      {
        allowAny: false,
        allowBoolean: true,
        allowNullish: false,
        allowNumber: true,
        allowRegExp: false,
      },
    ],
    "@typescript-eslint/unbound-method": [2, { ignoreStatic: true }],
    "@typescript-eslint/array-type": [2, { default: "array" }],

    "rulesdir/enum-naming-convention": 2,
    "rulesdir/type-naming-convention": 2,
    "rulesdir/interface-naming-convention": 2,
    "rulesdir/do-not-use-enum-keys": 2,
    "rulesdir/component-params-type": 2,
    "rulesdir/no-unnecessary-condition": 1,
  },
};
