import { initConfigs } from "./get-config.js";
import { eslint } from "./eslint/eslint.js";
import { types } from "./types.js";
import { dependencies } from "./deps.js";
import { logger } from "../utils/logger.js";
import { createTimeLabel } from "../utils/create-time-label.js";
import { run } from "../utils/run.js";
import { stylelint } from "./stylelint/stylelint.js";
import { decreasing } from "./decreasing.js";

const NAME = "Check";

const CHECKERS = {
  eslint,
  stylelint,
  types,
  dependencies,
  decreasing,
};

const check = async () => {
  const { only, configs } = await initConfigs();

  let timeLabels = [];

  const results = await Promise.all(
    Object
      .entries(CHECKERS)
      .reduce(
        (acc, [key, value]) => {
          const config = configs[key];

          if (config === undefined) {
            logger.error(NAME, `"${key}" config is not defined`);
            process.exit(1);
          }

          if (config === null) {
            if (value._optional) {
              if (!only || only.includes(key)) {
                logger.warn(NAME, `"${value._name}" config is missing`);
              }
            } else {
              logger.error(NAME, `"${value._name}" config must be implemented`);
              process.exit(1);
            }

            return acc;
          }

          if (!only || only.includes(key)) {
            const timeLabel = createTimeLabel(value._name);

            timeLabels.push(timeLabel);

            acc.push(value().finally(timeLabel.end));

            return acc;
          }

          return acc;
        },
        [],
      ),
  );

  timeLabels.forEach((it) => {
    it.log();
  });

  return results.some(Boolean);
};

run(NAME, check);
