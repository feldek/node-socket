import {getChangedPackages} from "../utils/get-changed-packages.js";
import {getConfig} from "./get-config.js";
import {logger} from "../utils/logger.js";

const NAME = "Decreasing";

let CONFIG = null;

const initializeConfig = async () => {
  const eslintConfig = await getConfig("eslint");
  const typesConfig = await getConfig("types");
  const stylelintConfig = await getConfig("stylelint");

  const current = [eslintConfig.count, typesConfig.count, stylelintConfig.count].reduce(
    (acc, cur) => {
      if (!cur) {
        return acc;
      }

      let next = acc;

      if (typeof cur === "number") {
        next += cur;

        return next;
      }

      if (typeof cur.disabled === "number") {
        next += cur.disabled;
      }

      if (typeof cur.plain === "number") {
        next += cur.plain;
      }

      return next;
    },
    0,
  );

  CONFIG = await getConfig("decreasing", (base) => ({
    ...base,
    start: new Date(`${base.start}T00:00:00.000Z`),
    current,
  }));
};

const decreasing = async () => {
  await initializeConfig();

  const changed = await getChangedPackages([], []);

  if (!changed.get(CONFIG.project)) {
    logger.success(NAME, `unchanged`);

    return false;
  }

  let daysPassed = 0;

  const curTime = Date.now();

  let time = CONFIG.start.getTime();

  if (time > curTime) {
    logger.success(NAME, `start delayed`);

    return false;
  }

  while (time < Date.now()) {
    const day = new Date(time).getUTCDay();

    if (day !== 0 && day !== 6) {
      daysPassed++;
    }

    time += 1000 * 60 * 60 * 24;
  }

  const expected = CONFIG.initial - (daysPassed * CONFIG.step);

  const diff = CONFIG.current - expected;

  if (diff > 0) {
    logger.error(NAME, `count exceeded by ${diff}`);

    return true;
  }

  const reserve = CONFIG.step * 2 + diff;

  if (reserve < 0) {
    logger.error(NAME, `reserve could not be greater that two steps (reduce initial count in config by ${-reserve})`);

    return true;
  }

  logger.success(NAME, `count satisfies (reserve ${CONFIG.step - reserve})`);

  return false;
}

decreasing._name = NAME;
decreasing._optional = true;

export {decreasing}
