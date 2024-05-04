"use strict";

module.exports = {
  create(context) {
    const physicalFilename = context.getPhysicalFilename();

    const [, tail] = physicalFilename.split("/javascript/packages/");

    const splittedTail = tail.split("/");

    let packageName = splittedTail[0];

    /**
     * Chat have nested structure
     * In general to detect package package.json must be found
     * But reading file is slower that just splitting and comparing strings
     * For now crutch for chat is better solution
     */
    if (packageName === "chat") {
      packageName = splittedTail[1];
    }

    const nest = tail.match(/\//g).length;

    return {
      ImportDeclaration(node) {
        const { source: { value } } = node;

        if (value.startsWith("@sb/")) {
          const [, sourcePackageName] = value.split("/");

          if (sourcePackageName === packageName) {
            context.report({
              node,
              message: "Import from package itself by absolute path is not allowed",
            });
          }

          if (value.includes("/src/") || value.endsWith("/src")) {
            context.report({
              node,
              message: "Import from src of mono packages is not allowed",
            });
          }
        }

        const out = value.split("..").length - 1;

        if (out >= nest) {
          context.report({
            node,
            message: "Relative import from outside of package is not allowed",
          });
        }
      },
    };
  },
};
