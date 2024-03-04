const logger = {
  info: (source, text) => {
    console.info(`\x1b[36m\x1b[1m${source} - ${text}\x1b[0m`);
  },
  success: (source, text) => {
    console.log(`\x1b[32m\x1b[1m${source} - ${text}\x1b[0m`);
  },
  warn: (source, text) => {
    console.warn(`\x1b[33m\x1b[1m${source} - ${text}\x1b[0m`);
  },
  error: (source, text) => {
    console.error(`\x1b[31m\x1b[1m[ERROR] ${source} - ${text}\x1b[0m`);
  },
  file: (file) => {
    if (Array.isArray(file)) {
      file.forEach((it) => {
        console.log(it, "");
      });
    } else {
      console.log(file, "");
    }
  },
};

export { logger };
