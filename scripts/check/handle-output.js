import fs from "node:fs/promises";
import path from "node:path";
import { ENVS } from "../utils/envs.js";
import { logger } from "../utils/logger.js";

const readOutput = async (name, filePath) => {
  try {
    await fs.access(filePath);
  } catch {
    if (!ENVS.CI) {
      logger.warn(name, "output file does not exist");
    }

    return null;
  }

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    if (!ENVS.CI) {
      logger.warn(name, "could not read output file");
    }
  }

  return null;
};

const handleOutput = async (outputPath, name, fileNames, extra) => {
  const stats = new Map();
  let maxNameLength = 0;

  fileNames.forEach((it) => {
    let [name] = it.split(":");

    name = `javascript/${name.split("/javascript/")[1]}`;

    if (name.length > maxNameLength) {
      maxNameLength = name.length;
    }

    stats.set(name, (stats.get(name) ?? 0) + 1);
  });

  let data = "";

  stats.forEach((value, key) => {
    data += `${key.padEnd(maxNameLength + 4, " ")}${value}\n`;
  })

  if (extra) {
    data += `\n${extra}`;
    data = data.trim();
  }

  const pathToFile = path.join(outputPath, `${name.toLowerCase().replace(/\s+/g, "_")}.txt`);

  const oldOutput = await readOutput(name, pathToFile);

  const outdated = oldOutput === null
    ? true
    : oldOutput !== data;

  if (outdated) {
    if (ENVS.CI) {
      logger.warn(name, "output file outdated. Run check locally and commit changes");
    } else {
      logger.warn(name, "output file outdated. Commit changes");

      await fs.writeFile(pathToFile, data);
    }
  } else if (!ENVS.CI && oldOutput !== null) {
    logger.info(name, "output file is up to date");
  }
};

export { handleOutput };
