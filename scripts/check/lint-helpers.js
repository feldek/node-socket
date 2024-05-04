import { logger } from "../utils/logger.js";

const getFormatterPath = (initPath, dirName, module = "cjs") => {
  let stepsOut = initPath.split("/javascript/packages/")[1].match(/\//g)?.length ?? 0;

  const extension = module === "esm" ? "js" : "cjs";

  return `${"../".repeat(stepsOut + 2)}scripts/check/${dirName}/formatter.${extension}`;
};

const getFileNamesWithProblems = (stdout) => {
  const lines = stdout.split("\n");

  const names = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("\/")) {
      names.push(line.split(" ")[0].slice(0, -1));
    }

    i++;
  }

  return names;
};

const extractStats = (stdout) => stdout.match(/⏣ Stats ⏣([\s\S]*?)⏣\s/)[1].trim();

const parseProblemsCount = (name, stdout) => {
  let count;

  try {
    count = Number.parseInt(stdout.match(/⏣\s(\d+)\sProblems\s⏣/)[1])
  } catch (e) {
    count = null;
  }

  if (isNaN(count)) {
    logger.error(name, `unable to parse integer problems count. Parsed - ${count}`);

    return true;
  }

  return count;
};

export {
  getFormatterPath,
  getFileNamesWithProblems,
  extractStats,
  parseProblemsCount,
};
