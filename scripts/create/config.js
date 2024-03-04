/**
 * TODO maybe "singleton" for config in separate file is not a good idea
 */
import { readPackages } from "../utils/read-packages.js";
import { PACKAGE_TYPE } from "./models.js";

let CONFIG = null;

const initializeConfig = async () => {
  const packages = await readPackages();
  const inquirer = await import("inquirer");

  const answers = await inquirer.default.prompt([
    {
      type: "input",
      message: "Package Path",
      name: "path",
      validate(input) {
        if (!/^[a-z0-9-/]+$/.test(input)) {
          return "Package Path could consist only of lowercase letters, dashes or slashes";
        }

        const exist = Object
          .values(packages)
          .some((it) => it.path.endsWith(`/packages/${input}`));

        if (exist) {
          return "Such Package already exist";
        }

        return true;
      },
    },
    {
      type: "list",
      message: "Package Type",
      name: "type",
      choices: Object.values(PACKAGE_TYPE),
    },
  ]);

  answers.path = answers.path.split("/");

  CONFIG = {
    name: answers.path[answers.path.length - 1],
    path: answers.path,
    type: answers.type,
  };
};

export { CONFIG, initializeConfig };
