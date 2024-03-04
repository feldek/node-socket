import { logger } from "./logger.js";

const round = (number, precision) => {
  if (precision === 0) {
    return Math.floor(number);
  }

  const factor = Math.pow(10, precision);
  const tempNumber = number * factor;
  const roundedTempNumber = Math.floor(tempNumber);

  return roundedTempNumber / factor;
};

const formatMilliseconds = (time) => {
  if (time >= 60_000) {
    const ms = time % 60_000;

    const minutes = (time - ms) / 60_000;

    const part = round(ms / 6_000, 0);

    if (part === 0) {
      return `${minutes}m`;
    }

    return `${minutes}.${part}m`
  }

  if (time >= 1000) {
    return `${round(time / 1000, 1)}s`;
  }

  return `${round(time, 0)}ms`;
};

const createTimeLabel = (name) => {
  logger.info(name, "started");

  const startTime = performance.now();
  let endTime = null;

  const end = () => {
    if (endTime) {
      logger.error("Create time label", `"${name}" already ended`);
      process.exit(1);
    }

    endTime = performance.now();
  };

  const log = () => {
    if (!endTime) {
      end();
    }

    logger.info(name, `finished in ${formatMilliseconds(endTime - startTime)}`);
  };

  return {
    end,
    log,
  };
};

export { createTimeLabel };
