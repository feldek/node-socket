import { getConfig } from "../get-config.js";
import { execShellCommand } from "../../utils/exec-shell-command.js";
import { countPatternFiles } from "../../utils/count-pattern-files.js";
import { logger } from "../../utils/logger.js";
import { ENVS } from "../../utils/envs.js";
import { handleOutput } from "../handle-output.js";
import { getComposedCount } from "../get-composed-count.js";
import { extractStats, getFileNamesWithProblems, getFormatterPath, parseProblemsCount } from "../lint-helpers.js";

const NAME = "ESLint";

let CONFIG = null;

const initializeConfig = async () => {
  CONFIG = await getConfig("eslint", (base, withInitPath) => {
    const count = getComposedCount(base.count);

    const flags = base.flags ?? [];

    if (!ENVS.CI) {
      flags.push("--fix");
    }

    return {
      ...base,
      count,
      filesEntry: withInitPath(base.entry),
      formatterPath: getFormatterPath(base.initPath, "eslint"),
      flags: flags.join(" "),
    }
  });
};

const eslint = async () => {
  await initializeConfig();

  const disabledFilesCount = await countPatternFiles(CONFIG.filesEntry, /\/\*(\s?)+eslint-disable(\s?)+\*\//g);

  const {
    stdout,
    error
  } = await execShellCommand(`cd ${CONFIG.initPath} && NODE_OPTIONS="--max-old-space-size=12288" eslint -f ${CONFIG.formatterPath} ${CONFIG.entry} ${CONFIG.flags}`);

  if (!ENVS.CI) {
    if (disabledFilesCount.fileNames.length > 0) {
      logger.warn(NAME, "files with eslint-disable");
      logger.file(disabledFilesCount.fileNames);
    }
  }

  if (error) {
    logger.error(NAME, "errors");
    console.log(stdout);
  } else if (!ENVS.CI) {
    console.log(stdout);
  }

  if (error) {
    console.error(error.message ?? "Unknown error");

    return true;
  }

  await handleOutput(
    CONFIG.outputPath,
    NAME,
    getFileNamesWithProblems(stdout),
    extractStats(stdout),
  );

  const disabledCount = disabledFilesCount.count;
  const plainCount = parseProblemsCount(NAME, stdout);

  if (plainCount === true) {
    return true;
  }

  if (disabledCount === CONFIG.count.disabled && plainCount === CONFIG.count.plain) {
    if (!ENVS.CI) {
      logger.success(NAME, `eslint-disable count ${disabledCount} `);
      logger.success(NAME, `plain count ${plainCount}`);
    }

    return false;
  }

  if (disabledCount > CONFIG.count.disabled) {
    logger.error(NAME, `eslint-disable count exceeded by ${disabledCount - CONFIG.count.disabled} (${disabledCount})`);
  } else if (disabledCount < CONFIG.count.disabled) {
    logger.error(NAME, `eslint-disable count reduced by ${CONFIG.count.disabled - disabledCount}. Update count in config (${disabledCount})`);
  }

  if (plainCount > CONFIG.count.plain) {
    logger.error(NAME, `plain count exceeded by ${plainCount - CONFIG.count.plain} (${plainCount})`);
  } else if (plainCount < CONFIG.count.plain) {
    logger.error(NAME, `plain count reduced by ${CONFIG.count.plain - plainCount}. Update count in config (${plainCount})`);
  }

  return true;
};

eslint._name = NAME;
eslint._optional = true;

export { eslint };
