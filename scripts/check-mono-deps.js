import fs from "node:fs/promises";
import path from "node:path";
import { handlePath } from "./handle-path.js";
import { readPackages } from "./utils/read-packages.js";
import { getMonoDependencyName } from "./utils/dependencies.js";
import { run } from "./utils/run.js";

/**
 * @import url(...);
 * @import "..."
 * import "..."
 * require("...")
 */
const IMPORT_REX_EXP = /(@?import\s*(?:[\w$*\s{},]*\s*from\s*?|)(?:(url)?\(?".*?"\)?|\(?'.*?'\)?))|((import|require)\s*\(\s*(?:".*?"|'.*?')\s*\))/g;

const EXTENSIONS = [
  "js",
  "mjs",
  "cjs",
  "jsx",
  "ts",
  "tsx",
  "css",
  "scss",
];

const SCRIPT_PACKAGE_NAMES = [
  "ref-loader",
];

const packageReader = async (packagePath, jsonPath, jsonContent) => {
  const data = {};

  if (jsonContent.scripts) {
    Object
      .values(jsonContent.scripts)
      .forEach(
        (script) => {
          SCRIPT_PACKAGE_NAMES.forEach(
            (packageName) => {
              if (script.includes(`@sb/${packageName}`)) {
                if (!data[packageName]) {
                  data[packageName] = [];
                }

                if (!data[packageName].includes(jsonPath)) {
                  data[packageName].push(jsonPath);
                }
              }
            },
          )
        },
      );
  }

  await fs
    .readdir(packagePath, "utf-8")
    .then((names) => {
      for (const name of names) {
        if (/^.eslintrc.(c?js|json)$/.test(name)) {
          data["eslint-config-linter"] = [path.join(packagePath, name)];
        }

        if (/^stylelint.config.(m?js)$/.test(name)) {
          data["stylelint-config"] = [path.join(packagePath, name)];
        }

        if (data["eslint-config-linter"] && data["stylelint-config"]) {
          break;
        }
      }
    });

  return { data };
};

const getPackagesInfo = async () => {
  const info = {};

  const packages = await readPackages(packageReader);

  SCRIPT_PACKAGE_NAMES.forEach(
    (packageName) => {
      if (!packages[packageName]) {
        console.error(`\x1b[31mPredefined package \x1B[1m\x1B[4m\x1B[4m${packageName}\x1b[0m\x1b[31m does not exist\x1b[0m`);

        process.exit(1);
      }
    },
  )

  await Promise.all(Object.entries(packages).map(
    async ([packageName, packageInfo]) => {
      info[packageName] = {
        jsonPath: packageInfo.jsonPath,
        monoDependencies: packageInfo.monoDependencies,
        data: packageInfo.data,
      };

      await handlePath(
        { sourcePath: packageInfo.path, extensions: EXTENSIONS },
        (filePath, fileContent) => {
          const match = fileContent.match(IMPORT_REX_EXP);

          if (!match) {
            return;
          }

          match.forEach((item) => {
            const splitted = item.split(/(['"])/);

            const from = splitted[splitted.length - 3].trim();

            const name = getMonoDependencyName(from);

            if (name) {
              if (!info[packageName].data[name]) {
                info[packageName].data[name] = [];
              }

              info[packageName].data[name].push(filePath);
            }
          });
        })
    },
  ));

  return info;
}

const checkForIncorrect = (packagesInfo) => {
  let incorrect = false;

  Object
    .entries(packagesInfo)
    .forEach(([packageName, packageInfo]) => {
        Object
          .entries(packageInfo.data)
          .forEach(([dependency, filesPath]) => {
              if (!packageInfo.monoDependencies.includes(dependency)) {
                incorrect = true;

                if (dependency === packageName) {
                  console.error(`\n\x1b[31mPackage \x1B[1m\x1B[4m\x1B[4m${packageName}\x1b[0m\x1b[31m uses itself by absolute path\x1b[0m`);

                  console.info("  ", packageInfo.jsonPath, "");
                } else {
                  console.error(`\n\x1b[31mPackage \x1B[1m\x1B[4m\x1B[4m${packageName}\x1b[0m\x1b[31m uses \x1B[1m\x1B[4m\x1B[4m${dependency}\x1b[0m\x1b[31m without specifying it as dependency in package.json\x1b[0m`);

                  console.info("  ", packageInfo.jsonPath, "\n");
                }

                filesPath.forEach((filePath) => {
                  console.info(`  `, filePath, "");
                });
              }
            },
          );

        packageInfo.monoDependencies.forEach(
          (dependency) => {
            if (!packageInfo.data[dependency]) {
              incorrect = true;

              console.error(`\n\x1b[31mPackage \x1B[1m\x1B[4m\x1B[4m${packageName}\x1b[0m\x1b[31m has unused dependency \x1B[1m\x1B[4m\x1B[4m${dependency}\x1b[0m\x1b[31m in package.json\x1b[0m`);

              console.info("  ", packageInfo.jsonPath, "");
            }
          },
        );
      },
    );

  return incorrect;
};

const checkPackageForCircularity = (messages, packagesInfo, trace) => (packageName) => {
  const index = trace.findIndex((value) => value === packageName);

  if (index !== -1) {
    const packageNames = [...trace.slice(index), packageName];

    const message = `\n\x1b[31mPackage \x1B[1m\x1B[4m\x1B[4m${packageName}\x1b[0m\x1b[31m circularly uses itself: ${packageNames.map((traceItem) => `\x1B[1m\x1B[4m\x1B[4m${traceItem}\x1b[0m\x1b[31m`).join(" -> ")}\x1b[0m`;

    if (!messages.has(message)) {
      messages.add(message);

      console.error(message);

      console.info("  ", packagesInfo[packageName].jsonPath, "\n");

      packageNames.pop();
      packageNames.shift();

      packageNames.forEach((innerPackageName) => {
        console.info("  ", packagesInfo[innerPackageName].jsonPath, "");
      });
    }

    return;
  }

  const packageInfo = packagesInfo[packageName];

  Object
    .keys(packageInfo.data)
    .forEach(checkPackageForCircularity(messages, packagesInfo, [...trace, packageName]));
};

const checkForCircularity = (packagesInfo) => {
  const messages = new Set();

  Object
    .entries(packagesInfo)
    .forEach(([packageName, packageInfo]) => {
      Object
        .keys(packageInfo.data)
        .forEach(checkPackageForCircularity(messages, packagesInfo, [packageName]));
    });

  return messages.size > 0;
};

const checkMonoDeps = async () => {
  const packagesInfo = await getPackagesInfo();

  const incorrect = checkForIncorrect(packagesInfo);
  const circular = checkForCircularity(packagesInfo);

  return incorrect || circular;
};

run("Check mono deps", checkMonoDeps);
