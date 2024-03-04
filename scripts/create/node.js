import { checkConfigFactory, coreFiles, eslintrcFactory, maintainersJsonFactory, packageJsonFactory, tsConfigFactory } from "./shared.js";

const packageJson = packageJsonFactory(
  undefined,
  undefined,
  {
    dev: "yarn g:tsx watch -r @sb/ref-loader src/index.ts",
    prod: "yarn g:tsx -r @sb/ref-loader src/index.ts",
  },
)

const tsConfig = tsConfigFactory();

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

export { files };
