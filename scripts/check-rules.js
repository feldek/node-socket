import {readPackages} from "./utils/read-packages.js";
import {logger} from "./utils/logger.js";
import {run} from "./utils/run.js";
import path from "node:path";
import fs from "node:fs";

const NAME = "Check rules";

let PACKAGES = null;

const CHECK_EXCEPTIONS_PACKAGE_NAMES = [
  "assets",
  "eslint-config-linter",
  "drop-qa-attributes-webpack-plugin",
  "chunk-loader-webpack-plugin",
  "stylelint-config",
  "ssr-refresh",
  "ref-loader",
  "sofa-icons",
];

/**
 * Packages that uses webpack only for developing - they are not applications
 */
const BUNDLE_EXCEPTIONS_PACKAGE_NAMES = [
  "form",
  "form-new",
  "text-editor",
  "translator",
  "sofa-parser-ui",
  "rich-text-editor",
  "shared-storage",
  "tabs-manager",
  "adminui-auth-form",
  "emoji-picker",
];

const validateCheck = () => {
  const names = [];

  Object
    .entries(PACKAGES)
    .forEach(([name, info]) => {
      if (CHECK_EXCEPTIONS_PACKAGE_NAMES.includes(name)) {
        return;
      }

      if (info.content.scripts?.check !== "yarn g:check PATH=$INIT_CWD") {
        names.push(name);
      }
    });

  if (names.length > 0) {
    logger.error(NAME, `"check" script is missing`);

    names.forEach((name) => {
      console.log(" ", name);
    });

    return true;
  }
};

const validateBundle = () => {
  const names = [];

  Object
    .entries(PACKAGES)
    .forEach(([name, info]) => {
      if (BUNDLE_EXCEPTIONS_PACKAGE_NAMES.includes(name)) {
        return;
      }

      if (!fs.existsSync(path.join(info.path, ".webpack"))) {
        return;
      }

      if (!info.content.scripts?.["do-bundle"]) {
        names.push(name);
      }
    });

  if (names.length > 0) {
    logger.error(NAME, `"do-bundle" script is missing`);

    names.forEach((name) => {
      console.log(" ", name);
    });

    return true;
  }
};

const checkRules = async () => {
  PACKAGES = await readPackages();

  return validateCheck() || validateBundle();
};

run(NAME, checkRules);
