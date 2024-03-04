import fs from "node:fs/promises";
import path from "node:path";

const perform = async (dirName, regExp, files) => {
  const filesInDirectory = await fs.readdir(dirName);

  let index = 0;

  while (index < filesInDirectory.length) {
    const file = filesInDirectory[index];

    index++;

    const name = path.join(dirName, file);

    const stat = await fs.stat(name);

    if (stat.isDirectory()) {
      await perform(name, regExp, files);
    } else {
      const fileContent = await fs.readFile(name, "utf8");

      const matches = fileContent.match(regExp);

      if (matches) {
        files.set(name, matches.length);
      }
    }
  }
};

const countPatternFiles = async (rootPath, regExp) => {
  const files = new Map();

  await perform(rootPath, regExp, files);

  const fileNames = [];
  let count = 0;

  Array.from(files.entries()).forEach((entry) => {
    fileNames.push(entry[0]);
    count += entry[1];
  });

  return {
    fileNames,
    count,
  };
};

export { countPatternFiles };
