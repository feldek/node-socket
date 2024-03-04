import fs from "node:fs";
import path from "node:path";

const readPackages = (directory, result = []) => {
  const contents = fs.readdirSync(directory);

  const packageJson = contents.find(item => item === "package.json");

  if (packageJson) {
    result.push(directory);

    return;
  }

  contents.forEach(item => {
    const itemPath = path.join(directory, item);

    if (fs.statSync(itemPath).isDirectory()) {
      readPackages(itemPath, result);
    }
  });

  return result;
}

const packagesDirectory = path.resolve("..", "packages");
const packagePaths = readPackages(packagesDirectory);

for (const path of packagePaths) {
  const content = fs.readFileSync(`${path}/package.json`, { encoding: "utf-8" });

  const parsedPackageJson = JSON.parse(content);

  if (parsedPackageJson.type !== "module") {
    console.log(parsedPackageJson.name)
  }
}
