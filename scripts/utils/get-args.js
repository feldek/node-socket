import { logger } from "./logger.js";

const NAME = "Args";

const getArg = (name, required = false) => {
  const arg = [...process.argv].reverse().find((item) => item.startsWith(`${name}=`));

  if (arg === undefined) {
    if (!required) {
      return undefined;
    }

    logger.error(NAME, `"${name}" argument is not provided`)

    process.exit(1);
  }

  const value = arg.split("=")[1];

  if (value === undefined) {
    logger.error(NAME, `"${name}" value is not provided`)

    process.exit(1);
  }

  return value;
};

const getArgFactory = (name, required = false) => () => getArg(name, required);

const getInitPath = getArgFactory("PATH", true);

export { getArg, getInitPath };
