import { getChangedPackages } from "./get-changed-packages.js";
import { execShellCommand } from "./exec-shell-command.js";
import { logger } from "./logger.js";

const IGNORE = [
  /^backup($|\/)/,
  /^docs($|\/)/,
  /^etc($|\/)/,
  /^flutter($|\/)/,
  /^kotlin($|\/)/,
  /^(\w+)?\.\w+$/,
  /([.\/])Dockerfile$/,
  /\.md$/,
];

const FORCE_CHANGES = [
  /^etc\/ci\/trigger_all.md$/,
  /^javascript\/(?!packages\/)(?!.*\/\.)((?!Dockerfile).)*$/,
];

const forEachWorkspace = (cmd, included) => {
  let str = "";

  if (included.size > 0) {
    included.forEach((_, name) => {
      str += ` --include "@sb/${name}"`;
    });
  }

  return `yarn workspaces foreach -p -v -A${str} run ${cmd}`;
};

const createRunner = (name, ...cmds) =>
  async () => {
    if (cmds.length === 0) {
      return;
    }

    const changed = await getChangedPackages(IGNORE, FORCE_CHANGES);

    if (changed.size === 0) {
      return;
    }

    let cmd = "";

    cmds.forEach((it) => {
      if (cmd.length > 0) {
        cmd += " && ";
      }

      if (it.workspaces) {
        cmd += forEachWorkspace(it.value, changed);

        return;
      }

      cmd += it;

    });

    console.log(`\n> ${cmd}\n`);

    const nativeLog = console.log;

    const errors = new Set();

    console.log = (...args) => {
      args.forEach((arg) => {
        if (typeof arg !== "string") {
          return;
        }

        arg
          .split("\n")
          .forEach((line) => {
            if (line.includes("[ERROR]")) {
              errors.add(line);
            }
          });
      });

      nativeLog(...args);
    }

    const { stdout, error } = await execShellCommand(cmd, true);

    console.log = nativeLog;

    if (errors.size > 0) {
      console.error(`\x1b[41m\x1b[1m ERRORS \x1b[0m`);

      errors.forEach((error) => {
        console.error(error);
      });
    }

    if (error) {
      logger.error(name, "failed")

      process.exit(1);
    }

    console.log(stdout);
  };

export { createRunner };
