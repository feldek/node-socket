import path from "node:path";
import fs from "node:fs/promises";
import { getChangedPackages } from "./utils/get-changed-packages.js";
import { ENVS } from "./utils/envs.js";
import { getInitPath } from "./utils/get-args.js";
import { logger } from "./utils/logger.js";
import { run } from "./utils/run.js";

const NAME = "Write Changed Packages";

const perform = (ignore, forceChanges) =>
  async () => {
    if (!ENVS.CI) {
      logger.error(NAME, "available only in CI");

      process.exit(1);
    }

    let changed = await getChangedPackages(ignore, forceChanges);

    const value = `[\n  ${Array.from(changed.keys()).map((name) => `"${name}"`).join(",\n  ")}\n]`;

    await fs.writeFile(
      path.join(getInitPath(), "changed-packages.json"),
      `{ "value": ${value} }`,
    )
  };

const writeChangedPackages = (ignore, forceChanges) => {
  run(NAME, perform(ignore, forceChanges));
};

export { writeChangedPackages };
