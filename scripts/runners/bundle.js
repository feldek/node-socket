import { run } from "../utils/run.js";
import { createRunner } from "../utils/create-runner.js";

const NAME = "Bundle";

const check = createRunner(
  NAME,
  {
    value: "do-bundle",
    workspaces: true,
  },
);

run(NAME, check);
