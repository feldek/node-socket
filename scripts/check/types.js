import fs from "node:fs/promises";
import path from "node:path";
import { execShellCommand } from "../utils/exec-shell-command.js";
import { countPatternFiles } from "../utils/count-pattern-files.js";
import { getConfig } from "./get-config.js";
import { logger } from "../utils/logger.js";
import { ENVS } from "../utils/envs.js";
import { handleOutput } from "./handle-output.js";
import { getComposedCount } from "./get-composed-count.js";

const NAME = "Types";

let CONFIG = null;

const fileExists = async (_path) => {
  try {
    await fs.stat(_path);

    return true;
  } catch {
    return false;
  }
};

const initializeConfig = async () => {
  CONFIG = await getConfig("types", async (base) => {
    const count = getComposedCount(base.count);
    const tsConfigPath = `${base.initPath}/tsconfig.json`;
    const buildTsConfigPath = `${base.initPath}/tsconfig.build.json`;

    const buildExist = await fileExists(buildTsConfigPath);

    return {
      ...base,
      count,
      entry: path.join(base.initPath, base.entry),
      tsConfigPath,
      buildTsConfigPath: buildExist ? buildTsConfigPath : null,
      fileNamePrefix: base.initPath.split("/packages/")[0],
    }
  });
};

const isErrorLine = (line) => line.includes("error TS");

const getFileName = (line) => `${CONFIG.fileNamePrefix}/${line}`;

const logStdoutErrors = (stdout) => {
  logger.error(NAME, "errors");

  stdout
    .split("\n")
    .forEach((line) => {
      if (isErrorLine(line)) {
        logger.file(getFileName(line));
      }
    });
};

const extractErrors = (stdout) => {
  const internalFileNames = [];
  let externalCount = 0;

  const lines = stdout.split("\n");

  let i = 0;

  while (i < lines.length) {
    const item = lines[i];
    i++

    if (isErrorLine(item)) {
      if (item.includes(`/${CONFIG.project}/`)) {
        const [fileName, line, column] = getFileName(item).split(/[(,)]/);

        internalFileNames.push(`${fileName}:${line}:${column}`);
      } else {
        externalCount++;
      }
    }
  }

  return { internalFileNames, externalCount };
}

const types = async () => {
  await initializeConfig();

  const disabledFilesCount = await countPatternFiles(CONFIG.entry, /@(\s?)+ts-nocheck/g);

  if (CONFIG.buildTsConfigPath) {
    const { stdout, error } = await execShellCommand(`NODE_OPTIONS="--max-old-space-size=12288" yarn g:tsc --noEmit -p ${CONFIG.buildTsConfigPath}`);

    if (error) {
      logStdoutErrors(stdout);

      return true;
    }
  }

  const { stdout, error } = await execShellCommand(`NODE_OPTIONS="--max-old-space-size=12288" yarn g:tsc --noEmit -p ${CONFIG.tsConfigPath}`)

  if (error && !CONFIG.buildTsConfigPath) {
    logStdoutErrors(stdout);

    return true;
  }

  const errors = extractErrors(stdout);

  await handleOutput(
    CONFIG.outputPath,
    NAME,
    errors.internalFileNames,
    CONFIG.buildTsConfigPath ? `${errors.externalCount} External Problems` : null
  );

  const disabledCount = disabledFilesCount.count;
  const plainCount = errors.internalFileNames.length;

  if (disabledCount === CONFIG.count.disabled && plainCount === CONFIG.count.plain) {
    if (!ENVS.CI) {
      logger.success(NAME, `ts-nocheck count ${disabledCount}`);
      logger.success(NAME, `plain count ${plainCount}`);
    }

    return false;
  }

  if (!ENVS.CI) {
    if (disabledCount > 0) {
      logger.warn(NAME, "files with ts-nocheck");
      logger.file(disabledFilesCount.fileNames);
    }

    if (plainCount > 0) {
      logger.warn(NAME, "TS errors");
      logger.file(errors.internalFileNames);
    }
  }

  if (disabledCount > CONFIG.count.disabled) {
    logger.error(NAME, `ts-nocheck count exceeded by ${disabledCount - CONFIG.count.disabled} (${disabledCount})`);
  } else if (disabledCount < CONFIG.count.disabled) {
    logger.error(NAME, `ts-nocheck count reduced by ${CONFIG.count.disabled - disabledCount}. Update count in config (${disabledCount})`);
  }

  if (plainCount > CONFIG.count.plain) {
    logger.error(NAME, `plain count exceeded by ${plainCount - CONFIG.count.plain} (${plainCount})`);
  } else if (plainCount < CONFIG.count.plain) {
    logger.error(NAME, `plain count reduced by ${CONFIG.count.plain - plainCount}. Update count in config (${plainCount})`);
  }

  return true;
};

types._name = NAME;

export { types };
