import { run } from "../utils/run.js";
import { createRunner } from "../utils/create-runner.js";

const NAME = "Check ESLint";

const checkEslint = createRunner(
  NAME,
  {
    value: "check ONLY=eslint",
    workspaces: true,
  }
);

run(NAME, checkEslint);
