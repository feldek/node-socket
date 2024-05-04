const path = require("node:path");
const rulesdirPlugin = require("eslint-plugin-rulesdir");

rulesdirPlugin.RULES_DIR = path.resolve(__dirname, "rules");

module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "es6": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:jest/recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  "globals": {
    "document": "readonly",
    "navigator": "readonly",
    "window": "readonly",
  },
  "plugins": [
    "rulesdir",
    "react-hooks",
    "react",
    "deprecation",
  ],
  "rules": {
    // off
    "import/namespace": 0, // disabled because very low
    "react/prop-types": 0,
    "react/display-name": 0,
    "jsx-a11y/click-events-have-key-events": 0,
    "jsx-a11y/no-static-element-interactions": 0,
    "jsx-a11y/no-noninteractive-element-interactions": 0,
    "jsx-a11y/mouse-events-have-key-events": 0,
    "jsx-a11y/anchor-is-valid": 0,
    "jsx-a11y/label-has-associated-control": 0,
    "jsx-a11y/alt-text": 0,
    "jsx-a11y/no-autofocus": 0,
    "jsx-a11y/anchor-has-content": 0,
    "jsx-a11y/no-onchange": 0,
    "no-prototype-builtins": 0,
    "react/jsx-uses-react": 0,
    "react/react-in-jsx-scope": 0,
    "import/no-unresolved": 0,
    // don't use core, use eslint-plugin-import instead
    "no-duplicate-imports": 0,

    // warn
    "no-constant-condition": 1,
    "no-console": 1,
    "import/no-extraneous-dependencies": [1, { peerDependencies: true, optionalDependencies: true }],
    "no-param-reassign": [1, { props: false }],
    "rulesdir/no-disabled-checks": 1,
    "jest/no-conditional-expect": 1,
    "deprecation/deprecation": 1,

    // error
    "rulesdir/memo-component": 2,
    "rulesdir/jsx-no-reference-prop": 2,
    "rulesdir/component-display-name": 2,
    "rulesdir/jsx-element-max-length": 2,
    "rulesdir/sort-imports": 2,
    "rulesdir/no-empty-lines-between-imports": 2,
    "rulesdir/specified-exports": 2,
    "rulesdir/exports-location": 2,
    "rulesdir/jsx-children-spacing": 2,
    "rulesdir/multiline-ternary": 2,
    "rulesdir/jsx-no-multiline-prop": 2,
    "rulesdir/no-multiline-object-key": 2,
    "rulesdir/jsx-prop-new-line": 2,
    "rulesdir/jsx-key-after-spread": 2,
    "rulesdir/object-prop-newline": 2,
    "rulesdir/deprecated-form-imports": 2,
    "rulesdir/no-invalid-selectors": 1,
    "rulesdir/mono-imports": 2,
    "rulesdir/no-forbidden-imports": 2,
    "rulesdir/arguments-align": 2,
    "rulesdir/no-truethly-default-assign": 2,
    "array-bracket-spacing": [2, "never"],
    "array-element-newline": [2, "consistent"],
    "no-trailing-spaces": 2,
    "comma-spacing": [2, { before: false, after: true }],
    "func-call-spacing": 2,
    "function-call-argument-newline": [2, "consistent"],
    "key-spacing": [2, { mode: "strict", }],
    "operator-linebreak": 2,
    "newline-before-return": 2,
    "no-mixed-operators": 2,
    "react/jsx-closing-tag-location": 2,
    "react/jsx-closing-bracket-location": 2,
    "react/jsx-no-comment-textnodes": 2,
    "react/jsx-no-duplicate-props": 2,
    "react/jsx-props-no-multi-spaces": 2,
    "arrow-spacing": 2,
    "arrow-body-style": [2, "as-needed"],
    "curly": 2,
    "brace-style": [2, "1tbs"],
    "padded-blocks": [
      2,
      {
        blocks: "never",
        classes: "never",
        switches: "never"
      },
    ],
    "react/jsx-wrap-multilines": [
      2,
      {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "parens-new-line",
      },
    ],
    "react/jsx-tag-spacing": [
      2,
      {
        closingSlash: "never",
        beforeSelfClosing: "always",
        afterOpening: "never",
        beforeClosing: "never",
      },
    ],
    "react/jsx-curly-brace-presence": [2, { props: "always", children: "always" }],
    "react/jsx-curly-newline": [2, { singleline: "forbid", multiline: "require" }],
    "react/jsx-curly-spacing": [2, { when: "never", children: true }],
    "react/jsx-equals-spacing": [2, "never"],
    "react/jsx-max-depth": [2, { max: 10 }],
    "react/jsx-newline": [2, { prevent: false }],
    "react/jsx-no-useless-fragment": [2, { allowExpressions: true }],
    "react/self-closing-comp": 2,
    "react-hooks/rules-of-hooks": 2,
    "max-len": [
      2,
      140,
      2,
      {
        ignoreUrls: true,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignorePattern: "^import [^,]+ from |^export | implements | `.{30,}`",
      },
    ],
    "consistent-return": 2,
    "import/no-duplicates": 2,
    "no-multiple-empty-lines": [2, { max: 1 }],
    "comma-dangle": [2, "always-multiline"],
    "semi": [2, "always"],
    "arrow-parens": [2, "always"],
    "quotes": [2, "double"],
    "space-before-function-paren": [
      2,
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "object-curly-spacing": [2, "always"],
    "eol-last": [2, "always"],
    "indent": [2, 2, { SwitchCase: 1 }],
    "no-nested-ternary": 2,
    "no-unneeded-ternary": [2, { defaultAssignment: false }],
    "no-empty": [2, { allowEmptyCatch: true }],
    "newline-per-chained-call": [2, { ignoreChainWithDepth: 3}],
    "no-unused-vars": [2, { argsIgnorePattern: "^_", varsIgnorePattern: "^_"}],
    "no-empty-function": [
      2,
      {
        allow: ["methods", "generatorMethods", "getters", "setters", "constructors", "asyncMethods"],
      },
    ],
    "no-restricted-syntax": [
      2,
      {
        "selector": "CallExpression[callee.name='atob']",
        "message": "window.atob is deprecated. Use decodeBase64 from `@sb/utils`"
      },
      {
        "selector": "CallExpression[callee.name='window.atob']",
        "message": "window.atob is deprecated. Use decodeBase64 from `@sb/utils`"
      },
      {
        "selector": "CallExpression[callee.name='btoa']",
        "message": "window.btoa is deprecated. Use encodeBase64 from `@sb/utils`"
      },
      {
        "selector": "CallExpression[callee.name='window.btoa']",
        "message": "window.atob is deprecated. Use decodeBase64 from `@sb/utils`"
      },
    ],
  },
  "settings": {
    "react": {
      "version": "detect",
    },
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
