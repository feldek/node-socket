import { run } from "../utils/run.js";
import { createRunner } from "../utils/create-runner.js";

const NAME = "Check Extra & Stylelint & Dependencies & Types";

const check = createRunner(
  NAME,
  {
    value: "check^extra",
    workspaces: true,
  },
  {
    value: "check ONLY=stylelint,dependencies,types,decreasing",
    workspaces: true,
  },
);

run(NAME, check);
