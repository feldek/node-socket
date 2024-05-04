import fs from "node:fs";
import path from "node:path";
import { getConfig } from "./get-config.js";
import { logger } from "../utils/logger.js";
import { ENVS } from "../utils/envs.js";

/**
 * DEFAULT imports/exports not supported and will be ignored
 *
 * The reason - name export should be used instead of default
 *
 * If default exports need to be supported - pay attention to not trivial name extraction
 *
 * export default expression;
 * export default function functionName()
 *
 * DYNAMIC import supported only using specific syntax
 *
 * import("./").then(extractExport("EpicExport"))
 * import("./").then(extractExportDefault("ComponentExport"))
 */
const REG_EXP = {
  IMPORT_EFFECT: [
    /**
     * Import file for effect
     *
     * import "./"
     */
    /\bimport\s*"(\..+)"/g,
  ],

  IMPORT_DYNAMIC: [
    /**
     * Dynamic import
     *
     * import("./");
     */
    /\bimport\s*\(\s*"(\..+)"\s*\)/g,
  ],

  IMPORT_DYNAMIC_EPIC: [
    /**
     * Dynamic import of epic
     *
     * import("./").then(extractExport("EpicExport"))
     */
    /\bimport\s*\(\s*"(\..+)"\s*\)\s*\.then\s*\(\s*extractExport\s*\(\s*"([\w$]+)"\s*,?\s*\)\s*,?\s*\)/g,
    /**
     * Dynamic import with webpack "magic comments"
     *
     * import(\ * webpackChunkName: "myNamedChunk" * / "./").then(extractExport("EpicExport"))
     */
    /\bimport\s*\(\s*\/\*\s*.*\s*\*\s*\/\s*"(\..+)"\s*\)\s*\.then\s*\(\s*extractExport\s*\(\s*"([\w$]+)"\s*,?\s*\)\s*,?\s*\)/g,
  ],

  IMPORT_DYNAMIC_COMPONENT: [
    /**
     * Dynamic import of component
     *
     * import("./").then(extractDefaultExport("ComponentExport"))
     */
    /\bimport\s*\(\s*"(\..+)"\s*\)\s*\.then\s*\(\s*extractDefaultExport\s*\(\s*"([\w$]+)"\s*,?\s*\)\s*,?\s*\)/g,
    /**
     * Dynamic import with webpack "magic comments"
     *
     * import(/ * webpackChunkName: "myNamedChunk" * / "./").then(extractDefaultExport("ComponentExport"))
     */
    /\bimport\s*\(\s*\/\*\s*.*\s*\*\s*\/\s*"(\..+)"\s*\)\s*\.then\s*\(\s*extractDefaultExport\s*\(\s*"([\w$]+)"\s*,?\s*\)\s*,?\s*\)/g,
  ],

  IMPORT_ALL_AS: [
    /**
     * Import all from file as
     *
     * import * as React from "./"
     */
    /\bimport\s*\*\s*as\s+([\w$]+)\s+from\s*"(\..+)"/g,
  ],

  IMPORT_NAMES: [
    /**
     * Import names
     *
     * import { useMemo } from "./"
     * import type { TType } from "./"
     *
     */
    /\bimport(\s+type)?\s*{([\s\w$,]+)}\s*from\s*"(\..+)"/g,

    /**
     * Import names ignoring default
     *
     * import React, { useMemo } from "./"*
     */
    /\bimport\s+[\w$]+\s*,\s*{([\s\w$,]+)}\s*from\s*"(\..+)"/g,

  ],

  EXPORT_NAME: [
    /**
     * Export name
     *
     * export const x = 1
     * export type TType = any
     */
    /\bexport\s+(?!default)\w+\s+([\w$]+)/g,
  ],

  EXPORT_NAMES: [
    /**
     * Export names (also match on name re-exports)
     *
     * export { x, y}
     * export type { x, y }
     *
     * TODO not default
     */
    /\bexport(\s+type)?\s*{([\s\w$,]+)}/g,
  ],

  RE_EXPORT_ALL: [
    /***
     * Re-export all
     *
     * export * from "./"
     * export * as x from "./"
     *
     */
    /\bexport\s*\*\s*(as\s+[\w$]+\s+)?from\s*"(\..+)"/g,
  ],

  RE_EXPORT_NAMES: [
    /**
     * Re-export names
     *
     * export { name as name1 } from "./"
     *
     * TODO not default
     *
     * export { default as name1 } from "./"
     */
    /\bexport(\s+type)?\s*{([\s\w$,]+)}\s*from\s*"(\..+)"/g,
  ],
};

const IMPORT_TYPE = {
  effect: "effect",
  dynamic: "dynamic",
  name: "name",
};

const EXPORT_TYPE = {
  name: "name",
};

const RE_EXPORT_TYPE = {
  name: "name",
};

const NAME = "Dependencies";

let CONFIG = null;

const toPattern = (withInitPath, it) => {
  let value = it;

  if (!(value instanceof RegExp) && it.startsWith("^")) {
    value = new RegExp(`^${withInitPath(it.substring(1))}`);
  }

  if (!(value instanceof RegExp)) {
    value = withInitPath(value);
  }

  return {
    value,
    used: false,
  };
}

const initializeConfig = async () => {
  CONFIG = await getConfig("dependencies", (base, withInitPath) => {
    if (base.entries.length === 0) {
      logger.error(NAME, "no entries specified");
      process.exit(1);
    }

    const entries = base.entries.map((it) => toPattern(withInitPath, it));

    const ignoredFiles = [...entries];
    const ignoredExports = [];

    ignoredFiles.forEach((it) => {
      it.used = true;
    });

    if (base.ignore) {
      Object
        .entries(base.ignore)
        .forEach(([key, value]) => {
          const pattern = toPattern(withInitPath, key);

          if (value === true) {
            ignoredFiles.push(pattern);

            return;
          }

          ignoredExports.push([pattern, value]);
        });
    }

    return {
      ...base,
      dir: withInitPath(base.dir),
      entries,
      ignoredFiles,
      ignoredExports,
      extensions: ["ts", "tsx"],
    }
  });
};

const matchAll = (source, regExps) => {
  const result = regExps
    .reduce(
      (acc, cur) => {
        Array.from(source.matchAll(cur)).forEach((match) => {
          if (match) {
            acc.push(match);
          }
        });

        return acc;
      },
      [],
    );

  if (result.length === 0) {
    return null;
  }

  return result;
};

const extractNames = (source, extra) => source
  .replace(/\btype\s/g, "")
  .split(",")
  .reduce(
    (acc, cur) => {
      const trimmed = cur
        .replace(/\s\s+/g, " ")
        .trim();

      if (!trimmed) {
        return acc;
      }

      const withAlias = trimmed.match(/([\w$]+)\s+as\s+([\w$]+)/)

      if (withAlias) {
        acc.push({
          name: withAlias[1],
          alias: withAlias[2],
          ...extra,
        });
      } else {
        acc.push({
          name: trimmed,
          ...extra,
        });
      }

      return acc;
    },
    [],
  );

const extractFrom = (pathParts, from) => {
  let stepsOut = from.match(/\.\//g).length;

  if (from.startsWith("../")) {
    stepsOut += 1;
  }

  const slicedPath = pathParts
    .slice(0, -stepsOut)
    .join("/");

  const slicedFromPath = from.replace(/\.?\.\//g, "");

  const importPath = `/${slicedPath}/${slicedFromPath}`;

  let extensionIndex = 0;

  while (extensionIndex < CONFIG.extensions.length) {
    const extension = CONFIG.extensions[extensionIndex];

    extensionIndex++;

    const withExtension = `${importPath}.${extension}`;

    if (fs.existsSync(withExtension)) {
      return withExtension;
    }

    const indexWithExtension = `${importPath}/index.${extension}`;

    if (fs.existsSync(indexWithExtension)) {
      return indexWithExtension;
    }
  }

  return null;
};

/**
 * File will be treated as used but not it's exports
 */
const extractEffectImports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.IMPORT_EFFECT);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[1]);

      if (from) {
        result.push({
          type: IMPORT_TYPE.effect,
          from,
        });
      }
    });
  }

  return result;
};

/**
 * File will be treated as used but not it's exports
 */
const extractDynamicEffectImports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.IMPORT_DYNAMIC);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[1]);

      if (from) {
        result.push({
          type: IMPORT_TYPE.effect,
          from,
        });
      }
    });
  }

  return result;
};

/**
 * What exactly was imported dynamically from epic file
 */
const extractDynamicEpicsImports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.IMPORT_DYNAMIC_EPIC);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[1]);

      if (from) {
        result.push({
          type: IMPORT_TYPE.name,
          name: it[2],
          from,
        });
      }
    });
  }

  return result;
};

/**
 * What exactly was imported dynamically from component file
 */
const extractDynamicComponentsImports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.IMPORT_DYNAMIC_COMPONENT);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[1]);

      if (from) {
        result.push({
          type: IMPORT_TYPE.name,
          name: it[2],
          from,
        });
      }
    });
  }

  return result;
};

/**
 * FORBIDDEN - not possible to detect which exports was used(?)
 */
const extractAllAsImports = (_path, pathParts, source) => {
  const match = matchAll(source, REG_EXP.IMPORT_ALL_AS);

  if (match) {
    logger.error(NAME, "import everything from file is not allowed");
    logger.file(_path);

    process.exit(1);
  }

  return [];
};

/**
 * Names will be treated as used
 */
const extractNamesImports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.IMPORT_NAMES);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[3]);

      if (from) {
        result.push(
          ...extractNames(
            it[2],
            {
              type: IMPORT_TYPE.name,
              from,
            },
          ),
        );
      }
    });
  }

  return result;
};

const extractImports = (_path, pathParts, source) => [
  ...extractEffectImports(pathParts, source),
  ...extractDynamicEffectImports(pathParts, source),
  ...extractDynamicEpicsImports(pathParts, source),
  ...extractDynamicComponentsImports(pathParts, source),
  ...extractAllAsImports(_path, pathParts, source),
  ...extractNamesImports(pathParts, source),
];

/**
 * Single names
 */
const extractNameExports = (source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.EXPORT_NAME);

  if (match) {
    match.forEach((it) => {
      result.push({
        type: EXPORT_TYPE.name,
        name: it[1],
      });
    });
  }

  return result;
};

/**
 * Groups of names
 */
const extractNamesExports = (source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.EXPORT_NAMES);

  if (match) {
    match.forEach((it) => {
      result.push(
        ...extractNames(
          it[2],
          {
            type: EXPORT_TYPE.name,
          },
        )
          /**
           * TODO - Exclude default in regExp
           */
          .filter((name) => name.name !== "default"),
      );
    });
  }

  return result;
};

const extractExports = (source) => [
  ...extractNameExports(source),
  ...extractNamesExports(source),
];

/**
 * FORBIDDEN - increases bundling time dramatically
 */
const extractAllReExports = (_path, source) => {
  const match = matchAll(source, REG_EXP.RE_EXPORT_ALL);

  if (match) {
    logger.error(NAME, "re-export everything from file is not allowed");
    logger.file(_path);

    process.exit(1);
  }

  return [];
};

/**
 * Groups of names
 */
const extractNamesReExports = (pathParts, source) => {
  const result = [];

  const match = matchAll(source, REG_EXP.RE_EXPORT_NAMES);

  if (match) {
    match.forEach((it) => {
      const from = extractFrom(pathParts, it[3]);

      result.push(
        ...extractNames(
          it[2],
          {
            type: RE_EXPORT_TYPE.name,
            from,
          },
        )
          /**
           * TODO - Exclude default in regExp
           */
          .filter((name) => name.name !== "default"),
      );
    });
  }

  return result;
};

const extractReExports = (_path, pathParts, source) => [
  ...extractAllReExports(_path, source),
  ...extractNamesReExports(pathParts, source),
];

const isTest = (source) => source.includes("/__tests__/") ||
  source.includes(".test.") ||
  source.includes(".spec.");

const isSuitablePath = (source) => {
  if (
    source.includes("/@types/")
  ) {
    return false;
  }

  return CONFIG.extensions.some((it) => source.endsWith(`.${it}`));
};

const isIgnored = (_path) => {
  let matches = false;

  let index = 0;

  while (index < CONFIG.ignoredFiles.length) {
    const pattern = CONFIG.ignoredFiles[index];

    index++;

    if (pattern.value instanceof RegExp) {
      matches = !!_path.match(pattern.value);
    } else {
      matches = _path === pattern.value;
    }

    if (matches) {
      pattern.used = true;

      break;
    }
  }

  return matches;
};

const getIgnoredExports = (_path) => {
  let matches = false;

  let index = 0;

  while (index < CONFIG.ignoredExports.length) {
    const [pattern, exports] = CONFIG.ignoredExports[index];

    index++;

    if (pattern.value instanceof RegExp) {
      matches = !!_path.match(pattern.value);
    } else {
      matches = _path === pattern.value;
    }

    if (matches) {
      pattern.used = true;

      return exports;
    }
  }

  return [];
};

const checkFileUsage = (depsGraph, usedFiles, filePath) => {
  if (usedFiles.has(filePath)) {
    return;
  }

  usedFiles.add(filePath);

  const deps = depsGraph.graph.get(filePath);

  [...deps.imports, ...deps.reExports].forEach((it) => {
    checkFileUsage(depsGraph, usedFiles, it.from);
  });
}

const checkFilesUsage = (depsGraph) => {
  const usedFiles = new Set();

  CONFIG.entries.forEach((entry) => {
    const entries = [];

    if (entry.value instanceof RegExp) {
      [...depsGraph.graph.keys()].forEach((filePath) => {
        if (filePath.match(entry.value)) {
          entries.push(filePath);
        }
      });
    } else {
      entries.push(entry.value);
    }

    entries.forEach((filePath) => {
      if (!depsGraph.graph.has(filePath)) {
        logger.error(NAME, "entry does not exist");
        logger.file(filePath);

        process.exit(1);
      }

      checkFileUsage(depsGraph, usedFiles, filePath);
    })
  });

  const notUsedFiles = depsGraph
    .entries
    .reduce(
      (acc, [filePath]) => {
        if (
          isTest(filePath) ||
          usedFiles.has(filePath) ||
          isIgnored(filePath)
        ) {
          return acc;
        }

        acc.push(filePath);

        return acc;
      },
      [],
    );

  return {
    usedFiles: Array.from(usedFiles),
    notUsedFiles,
  };
};

const checkExportsUsage = (depsGraph, usedFiles) => {
  const notUsedExports = new Map();

  usedFiles.forEach((filePath) => {
    if (
      isTest(filePath) ||
      isIgnored(filePath)
    ) {
      return;
    }

    const ownDeps = depsGraph.graph.get(filePath);

    [...ownDeps.exports, ...ownDeps.reExports].forEach((ownDep) => {
      const ownDepName = ownDep.alias ?? ownDep.name;

      let entryIndex = 0;

      while (entryIndex < depsGraph.entries.length) {
        const [it, deps] = depsGraph.entries[entryIndex];

        entryIndex++;

        if (it === filePath) {
          continue;
        }

        let reExportIndex = 0;

        while (reExportIndex < deps.reExports.length) {
          const reExport = deps.reExports[reExportIndex];

          reExportIndex++

          if (reExport.from !== filePath) {
            continue;
          }

          if (ownDepName === reExport.name) {
            return;
          }
        }

        let importIndex = 0;

        while (importIndex < deps.imports.length) {
          const _import = deps.imports[importIndex];

          importIndex++;

          if (_import.from !== filePath) {
            continue;
          }

          if (_import.type === IMPORT_TYPE.dynamic) {
            return;
          }

          if (_import.type === IMPORT_TYPE.name) {
            if (ownDepName === _import.name) {
              return;
            }
          }
        }
      }

      const exports = getIgnoredExports(filePath);

      if (exports.includes(ownDep.name)) {
        return;
      }

      if (!notUsedExports.has(filePath)) {
        notUsedExports.set(filePath, []);
      }

      notUsedExports.get(filePath).push(ownDep.name);
    });
  });

  return notUsedExports;
};

const checkFileCircDep = (depsGraph, circDeps, filePath, checked = new Set(), trace = []) => {
  if (checked.has(filePath)) {
    return;
  }

  const index = trace.indexOf(filePath);

  if (index !== -1) {
    circDeps.push([...trace.slice(index), filePath]);

    return;
  }

  const deps = depsGraph.graph.get(filePath);

  [...deps.imports, ...deps.reExports].forEach((it) => {
    checkFileCircDep(depsGraph, circDeps, it.from, checked, [...trace, filePath]);
  });

  checked.add(filePath);
};

const checkCircDeps = (depsGraph) => {
  const circDeps = [];

  depsGraph.entries.forEach(([it]) => {
    checkFileCircDep(depsGraph, circDeps, it);
  });

  return circDeps.filter((list, index) => {
    const dIndex = circDeps.findIndex(
      (list1) => list1.length === list.length &&
        list1.every(
          (fileName, index1) => fileName === list[index1],
        ),
    );

    return index === dIndex;
  });
};

const buildDepsGraph = async (sourcePath = CONFIG.dir, graph = new Map()) => {
  const children = await fs.promises.readdir(sourcePath);

  let childIndex = 0;

  while (childIndex < children.length) {
    const child = children[childIndex];

    childIndex++;

    const childPath = path.join(sourcePath, child);

    const stat = await fs.promises.stat(childPath);

    if (stat.isDirectory()) {
      await buildDepsGraph(childPath, graph);

      continue;
    }

    if (!isSuitablePath(childPath)) {
      continue;
    }

    const content = await fs.promises.readFile(childPath, "utf8");

    const pathParts = childPath
      .split("/")
      .filter(Boolean)

    graph.set(
      childPath,
      {
        imports: extractImports(childPath, pathParts, content),
        exports: extractExports(content),
        reExports: extractReExports(childPath, pathParts, content),
      },
    );
  }

  return {
    graph,
    entries: Array.from(graph.entries()),
  };
};

const dependencies = async () => {
  await initializeConfig();

  const depsGraph = await buildDepsGraph();

  const circDeps = checkCircDeps(depsGraph);

  const hasCircDeps = circDeps.length > 0;

  if (hasCircDeps) {
    logger.error(NAME, "circular dependencies");

    circDeps.forEach((list, index) => {
      logger.file(list);

      if (index < circDeps.length - 1) {
        console.log("\n");
      }
    });

    return true;
  }

  const { usedFiles, notUsedFiles } = checkFilesUsage(depsGraph);

  const notUsedExports = checkExportsUsage(depsGraph, usedFiles);

  const notUsedExportsFilePaths = Array.from(notUsedExports.keys());

  const notUsedIgnorePatters = [];

  CONFIG.ignoredFiles.forEach((it) => {
    if (!it.used) {
      notUsedIgnorePatters.push(it);
    }
  });

  CONFIG.ignoredExports.forEach(([it]) => {
    if (!it.used) {
      notUsedIgnorePatters.push(it);
    }
  })

  if (
    notUsedFiles.length === 0 &&
    notUsedExportsFilePaths.length === 0 &&
    notUsedIgnorePatters.length === 0
  ) {

    if (!ENVS.CI) {
      logger.success(NAME, "valid");
    }

    return false;
  }

  if (notUsedIgnorePatters.length > 0) {
    logger.error(NAME, "unused ignore pattern in config");

    notUsedIgnorePatters.forEach((it) => {
      logger.file(it.value);
    });
  }

  if (notUsedFiles.length > 0) {
    logger.error(NAME, "unused files");
    logger.file(notUsedFiles);
  }

  if (notUsedExportsFilePaths.length > 0) {
    logger.error(NAME, "unused exports");

    notUsedExportsFilePaths.forEach((filePath) => {
      logger.file(filePath);

      notUsedExports.get(filePath).forEach((it) => {
        console.log(" ", it);
      });
    });
  }

  return true;
};

dependencies._name = NAME;
dependencies._optional = true;

export { dependencies };
