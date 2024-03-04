# Linter

Linter is base ESLint config. Contains a specific config for JavaScript and TypeScript. React rules also included.

## Workarounds

If in CI/CD lint show error that not produced locally:

- `@typescript-eslint/no-unsafe-return` - Add @types package in package.json
- `import/no-unresolved` - Add package in package.json

## Installation

Specify "@sb/eslint-config-linter" and "eslint-plugin-deprecation" as development dependencies.

```json
{
 "...",
 "devDependencies": {
    "...",
    "@sb/eslint-config-linter": "workspace:*",
    "eslint-plugin-deprecation": "2.0.0"
  }
}
```

## Usage

Create ".eslintrc.cjs" file in root directory of project. Extend from a necessary config and specify parser options.

- JavaScript config usage example

```javascript
module.exports = {
  "extends": [
    "@sb/eslint-config-linter/java-script",
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
    },
  },
};
```

- TypeScript config usage example

```javascript
module.exports = {
  "extends": [
    "@sb/eslint-config-linter/type-script.cjs",
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "tsconfigRootDir": __dirname,
    "ecmaFeatures": {
      "jsx": true,
    },
  },
};
```

Specify following scripts, specifying file extensions, that needed to be tested and directory.

```json
{
  "...",
  "scripts": {
    "...",
    "lint": "eslint --ext .js,.jsx src",
    "lint-fix": "eslint --fix --ext .js,.jsx src"
  }
}
```
