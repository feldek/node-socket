import path from "node:path";
import fs from "node:fs";
import { readPackages } from "./read-packages.js";
import { createTimeLabel } from "./create-time-label.js";
import { logger } from "./logger.js";
import { ENVS } from "./envs.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NAME = "Changed Packages";

const CHANGES_PATH = path.resolve(__dirname, "..", "..", "..", "CHANGES.txt");

const hasForceChange = (forceChanges) => forceChanges.some(
  (pattern) => CHANGES.some(
    (change) => {
      const result = pattern.test(change);

      if (result === true) {
        console.log(`Change ${change} trigger by force changes pattern ${pattern}.`);
      }

      return result;
    }
  ),
);

let CHANGES = null;

const initializeChanges = () => {
  if (fs.existsSync(CHANGES_PATH)) {
    CHANGES = fs
      .readFileSync(CHANGES_PATH, "utf-8")
      .split("\n");

    return;
  }

  if (!ENVS.CI) {
    CHANGES = true;

    return;
  }

  logger.error(NAME, `"CHANGES.txt" does not exist`);

  process.exit(1);
};

const hydrateChangedPackage = (packages, changed, change, nested) => {
  const entry = packages.find(([, info]) => new RegExp(`^${info.shortPath}($|\/)`).test(change));

  if (!entry) {
    return;
  }

  const [packageName] = entry;

  if (!nested) {
    changed.set(packageName, true);
  } else if (!changed.has(packageName)) {
    changed.set(packageName, false);
  }

  packages.forEach(([, info]) => {
    if (info.monoDependencies.includes(packageName)) {
      hydrateChangedPackage(packages, changed, info.shortPath, true);
    }
  });
};

const packageReader = async (packagePath) => ({
  shortPath: `javascript/${packagePath.split("mono/javascript/")[1]}`,
});

const getChangedPackages = async (ignore, forceChanges) => {
  const timeLabel = createTimeLabel(NAME);

  initializeChanges();

  const packages = await readPackages(packageReader);

  const packagesEntries = Object.entries(packages);

  const changed = new Map();

  if (CHANGES === true) {
    Object.keys(packages).forEach((packageName) => {
      changed.set(packageName, true);
    });

    logger.info(NAME, "all");

    return changed;
  }

  if (hasForceChange(forceChanges)) {
    console.log("HAS_FORCE_CHANGE")
    Object.keys(packages).forEach((packageName) => {
      changed.set(packageName, false);
    });
  }

  CHANGES.forEach((change) => {
    if (!ignore.some((pattern) => pattern.test(change))) {
      hydrateChangedPackage(packagesEntries, changed, change);
    }
  })

  timeLabel.log();

  if (changed.size === 0) {
    logger.info(NAME, "none");
  } else {
    if (changed.size === packagesEntries.length) {
      logger.info(NAME, "all");
    } else {
      logger.info(NAME, "list");
    }
  }

  return changed;
};

export {getChangedPackages};
