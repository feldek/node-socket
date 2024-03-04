import {
  checkConfigFactory,
  coreFiles,
  eslintrcFactory,
  libEffect,
  maintainersJsonFactory,
  packageJsonFactory,
  tsConfigFactory
} from "./shared.js";

const packageJson = packageJsonFactory(
  true,
  {
    ".": "./src/index.ts",
  },
);

const tsConfig = tsConfigFactory({
  noEmit: true,
});

const eslintrc = eslintrcFactory({
  node: true,
});

const checkConfig = checkConfigFactory();

const maintainers = maintainersJsonFactory();

const files = [
  ...coreFiles,
  checkConfig,
  packageJson,
  tsConfig,
  eslintrc,
  maintainers,
];

export { files, libEffect as effect };
