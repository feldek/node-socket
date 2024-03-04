import { createTimeLabel } from "./create-time-label.js";
import { collectErrorLogs } from "./collect-error-logs.js";

const run = (name, perform) => {
  const logCollectedErrors = collectErrorLogs();

  const timeLabel = createTimeLabel(name);

  perform()
    .then((failed) => {
      timeLabel.log();
      logCollectedErrors();
      process.exit(failed ? 1 : 0);
    })
    .catch((e) => {
      console.error(e);
      logCollectedErrors();
      timeLabel.log();
      process.exit(1)
    });
};

export { run };
