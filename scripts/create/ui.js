import {
  checkConfigFactory,
  coreFiles,
  eslintrcFactory,
  maintainersJsonFactory,
  packageJsonFactory,
  stylelintConfigFactory,
  tsConfigFactory,
} from "./shared.js";

const packageJson = packageJsonFactory(
  undefined,
  undefined,
  {
    dev: "webpack serve --config .webpack/",
    "check^stylelint": "yarn g:check PATH=$INIT_CWD ONLY=stylelint",
  },
  {
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "clsx": "2.1.0",
    "html-webpack-plugin": "5.6.0",
    "redux": "4.1.2",
    "redux-observable": "2.0.0",
    "reselect": "4.1.7",
    "rxjs": "7.8.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "esbuild-loader": "4.1.0",
    "webpack": "5.90.3",
    "webpack-cli": "5.1.4",
    "webpack-merge": "5.10.0",
  },
  {
    "@sb/stylelint-config": "workspace:*",
  }
)

const tsConfig = tsConfigFactory({
  jsx: "react-jsx",
});

const eslintrc = eslintrcFactory({
  browser: true,
});

const stylelintConfig = stylelintConfigFactory();

const checkConfig = checkConfigFactory(true);

const maintainers = maintainersJsonFactory();

const files = [
  ...coreFiles,
  checkConfig,
  packageJson,
  tsConfig,
  eslintrc,
  stylelintConfig,
  maintainers,
];

export { files };
