import path from "path";
import fs from "fs/promises";
import { getMonoDependencyName } from "./dependencies.js";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PACKAGES_PATH = path.resolve(__dirname, "..", "..", "packages");

const parsePackage = async (reader, sourcePath) => {
  const jsonPath = path.join(sourcePath, "package.json");

  const content = await fs
    .readFile(jsonPath, "utf-8")
    .then((content) => JSON.parse(content))
    .catch(() => null);

  if (!content) {
    return null;
  }

  const monoDependencies = Object
    .keys({ ...content.dependencies, ...content.devDependencies })
    .reduce(
      (acc, dependency) => {
        const name = getMonoDependencyName(dependency);

        if (name) {
          acc.push(name);
        }

        return acc;
      },
      [],
    );

  const red = await reader(sourcePath, jsonPath, content);

  return {
    [content.name.replace(/^@sb\//, "")]: {
      path: sourcePath,
      jsonPath,
      content,
      monoDependencies,
      ...red,
    },
  };
};

const readPackages = async (reader = () => Promise.resolve(null), sourcePath = PACKAGES_PATH, trace = [], packages = {}) => {
  let names = (await fs.readdir(sourcePath)).filter((name) => name !== "maintainers.json");

  names = names.filter((name) => !name.startsWith("."));

  await Promise.all(names.map(
    async (name) => {
      const cPath = path.join(sourcePath, name);

      const parsedPackage = await parsePackage(reader, cPath);

      if (parsedPackage) {
        Object.assign(packages, parsedPackage);
      } else {
        await readPackages(reader, cPath, [...trace, name], packages);
      }
    },
  ));

  return packages;
};

export { PACKAGES_PATH, readPackages };
