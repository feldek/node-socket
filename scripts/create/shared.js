import { CONFIG } from "./config.js";
import path from "node:path";
import { PACKAGES_PATH } from "../utils/read-packages.js";
import fs from "node:fs/promises";

const packageJsonFactory = (noEffects = null, exports = null, scripts = {}, dependencies = {}, devDependencies = {}) =>
  () => {
    const result = {
      name: `@sb/${CONFIG.name}`,
      private: true,
      version: "1.0.0",
      sideEffects: !noEffects,
      exports,
      scripts: {
        ...scripts,
        test: "yarn g:jest",
        check: "yarn g:check PATH=$INIT_CWD",
        "check^lint": "yarn g:check PATH=$INIT_CWD ONLY=lint",
        "check^types": "yarn g:check PATH=$INIT_CWD ONLY=types",
        "check^dependencies": "yarn g:check PATH=$INIT_CWD ONLY=dependencies",
      },
      dependencies: {
        "@sb/ref-loader": "workspace:*",
        "@sb/utils": "workspace:*",
        ...dependencies,
      },
      devDependencies: {
        "@sb/eslint-config-linter": "workspace:*",
        "eslint-plugin-deprecation": "2.0.0",
        ...devDependencies,
      },
    };

    if (noEffects === null) {
      delete result.sideEffects;
    }

    if (!exports) {
      delete result.exports;
    }

    return {
      path: ["package.json"],
      content: JSON.stringify(result, null, 2),
    };
  };

const tsConfigFactory = (compilerOptions = null) =>
  () => {
    const result = {
      extends: "../../configs/tsconfig.lib.json",
      compilerOptions,
      include: [
        "./src/**/*",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
      ],
    };

    if (!compilerOptions) {
      delete result.compilerOptions;
    }

    return {
      path: ["tsconfig.json"],
      content: JSON.stringify(result, null, 2),
    }
  };

const maintainersJsonFactory = () =>
  () => {
    const result = {
      maintainers: [],
      additionalReviewers: []
    };

    return {
      path: ["maintainers.json"],
      content: JSON.stringify(result, null, 2),
    }
  };

const index = () => ({
  path: ["src", "index.ts"],
  content: "",
});

const checkConfigFactory = (stylelint = false) =>
  () => ({
    path: ["check.config.cjs"],
    content: `const eslint = {
  count: 0,
  entry: "src",
};

const stylelint = ${stylelint ? "{\n  count: 0,\n};\n\" : \"\"}" : "null"};

const types = {
  count: 0,
  entry: "src",
};

const dependencies = {
  dir: "src",
  entries: [
    "src/index.ts",
  ],
  ignore: [],
};

const decreasing = null;

module.exports = {
  eslint,
  stylelint,
  types,
  dependencies,
  decreasing,
};
`,
  });

const eslintrcFactory = (env = {}) =>
  () => {
    const result = {
      env: {
        es2022: true,
        ...env,
      },
      extends: [
        "@sb/eslint-config-linter/type-script.cjs",
      ],
      globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: "__dirname",
      },
      ignorePatterns: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "stylelint.config.js",
      ],
      plugins: [
        "@typescript-eslint",
      ],
    };

    return {
      path: [".eslintrc.cjs"],
      content: `module.exports = ${JSON.stringify(result, null, 2)};\n`.replace("\"__dirname\"", "__dirname"),
    }
  };

const stylelintConfigFactory = () =>
  () => {
    const result = {
      extends: [
        "@sb/stylelint-config",
      ],
    };

    return {
      path: ["stylelint.config.js"],
      content: `export default ${JSON.stringify(result, null, 2)};\n`,
    }
  };

const jestConfig = () => {
  const result = {
    transform: {
      "^.+\\.(ts|tsx)$": ["@swc/jest"],
    },
    testMatch: ["**/?(*.)+(spec).ts"],
    roots: [
      "<rootDir>/src/__tests__",
    ],
    moduleNameMapper: "moduleNameMapper()",
  };

  return {
    path: ["jest.config.mjs"],
    content: `import { moduleNameMapper } from "@sb/ref-loader/jest.js";

export default ${JSON.stringify(result, null, 2).replace("\"moduleNameMapper()\"", "moduleNameMapper()")};
`,
  }
};

const coreFiles = [
  index,
  jestConfig,
];

const libEffect = async () => {
  const tsConfigPath = path.resolve(PACKAGES_PATH, "..", "configs", "tsconfig.lib.json");

  const libTsConfig = JSON.parse(await fs.readFile(tsConfigPath, "utf-8"));

  const pathBase = `../packages/${CONFIG.path.join("/")}`;

  libTsConfig.compilerOptions.paths[`@sb/${CONFIG.name}`] = [
    `${pathBase}/src/index.ts`,
  ];

  libTsConfig.references.push({
    path: `${pathBase}/tsconfig.json`,
  });

  await fs.writeFile(tsConfigPath, JSON.stringify(libTsConfig, null, 2));
}

export {
  packageJsonFactory,
  tsConfigFactory,
  eslintrcFactory,
  stylelintConfigFactory,
  checkConfigFactory,
  maintainersJsonFactory,
  coreFiles,
  libEffect,
};
