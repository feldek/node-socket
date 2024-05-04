import path from "node:path";
import { getArg, getInitPath } from "../utils/get-args.js";
import fs from "node:fs";

let CONFIGS = null;

const initConfigs = async () => {
  if (!CONFIGS) {
    const initPath = getInitPath();
    let only = getArg("ONLY");

    let imported = await import(path.resolve(initPath, "check.config.cjs"))
      .then((it) => it.default)

    if (only) {
      only = only.split(",");

      imported = Object
        .entries(imported)
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;

            return acc;
          },
          {},
        );
    }

    CONFIGS = {
      only,
      initPath,
      project: initPath.split("/").pop(),
      configs: imported,
    };
  }

  return CONFIGS;
};

const getConfig = async (name, enhancer) => {
  const { initPath, project, configs } = await initConfigs();

  const outputPath = path.join(initPath, ".check");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const config = {
    ...configs[name],
    project,
    initPath,
    outputPath,
  };

  if (enhancer) {
    return await enhancer(config, (value) => path.resolve(initPath, value));
  }

  return config;
};

export { initConfigs, getConfig };
