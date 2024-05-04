import fs from "node:fs/promises";
import path from "node:path";

const handlePath = async (config, handler) => {
  const { sourcePath, extensions } = config;

  const content = await fs.readdir(sourcePath);

  let index = 0;

  while (index < content.length) {
    const c = content[index];

    index++;

    const cPath = path.join(sourcePath, c);

    const stat = await fs.stat(cPath);

    if (stat.isDirectory()) {
      await handlePath({ extensions, sourcePath: cPath }, handler);

      continue;
    }

    if (extensions.some((extension) => c.endsWith(`.${extension}`))) {
      const cContent = await fs.readFile(cPath, "utf-8");

      handler(cPath, cContent);
    }
  }
}

export { handlePath };
