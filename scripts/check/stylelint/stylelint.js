import { getConfig } from "../get-config.js";
import { execShellCommand } from "../../utils/exec-shell-command.js";
import { logger } from "../../utils/logger.js";
import { ENVS } from "../../utils/envs.js";
import { handleOutput } from "../handle-output.js";
import { extractStats, getFileNamesWithProblems, getFormatterPath, parseProblemsCount } from "../lint-helpers.js";

const NAME = "Stylelint";

let CONFIG = null;

const initializeConfig = async () => {
  CONFIG = await getConfig("stylelint", (base) => {
    const flags = base.flags ?? [];

    if (!ENVS.CI) {
      flags.push("--fix");
    }

    return {
      ...base,
      flags,
      formatterPath: getFormatterPath(base.initPath, "stylelint", "esm"),
    }
  });
};

const stylelint = async () => {
  await initializeConfig();

  const {
    stdout,
    error
  } = await execShellCommand(`cd ${CONFIG.initPath} && stylelint "**/*.css" --custom-formatter ${CONFIG.formatterPath} ${CONFIG.flags}`);

  if (error) {
    console.error(error.message ?? "Unknown error");

    return true;
  }

  const count = parseProblemsCount(NAME, stdout);

  if (count === true) {
    return true;
  }

  if (CONFIG.count === 0 && count > 0) {
    logger.error(NAME, "errors");
    console.log(stdout);

    return true;
  }

  if (!ENVS.CI) {
    console.log(stdout);
  }

  await handleOutput(
    CONFIG.outputPath,
    NAME,
    getFileNamesWithProblems(stdout),
    extractStats(stdout),
  );

  if (count === CONFIG.count) {
    if (!ENVS.CI) {
      logger.success(NAME, `count ${count}`);
    }

    return false;
  }

  if (count > CONFIG.count) {
    logger.error(NAME, `count exceeded by ${count - CONFIG.count} (${count})`);
  } else if (count < CONFIG.count) {
    logger.error(NAME, `count reduced by ${CONFIG.count - count}. Update count in config (${count})`);
  }

  return true;
};

stylelint._name = NAME;
stylelint._optional = true;

export { stylelint };
