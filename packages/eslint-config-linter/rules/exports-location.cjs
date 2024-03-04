"use strict";

function isExport(node) {
  return node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration";
}

function isReExport(node) {
  return ((node.type === "ExportNamedDeclaration" && !!node.source) || node.type === "ExportAllDeclaration");
}

module.exports = {
  create(context) {
    return {
      Program(node) {
        let firstNonExport = null;
        let lastNonExport = null;

        let lastReExport = null;

        let firstExport = null;

        node.body.forEach((node) => {
          if (isReExport(node)) {
            lastReExport = node;
          } else if (isExport(node)) {
            if (!firstExport) {
              firstExport = node;
            }
          } else {
            if (!firstNonExport) {
              firstNonExport = node;
            }

            lastNonExport = node;
          }
        });

        node.body.forEach((node) => {
          if (isReExport(node)) {
            if (firstNonExport && node.range[1] > firstNonExport.range[0]) {
              context.report({
                node,
                message: "Re-exports should be before non-exports",
              });
            }

            if (firstExport && node.range[1] > firstExport.range[0]) {
              context.report({
                node,
                message: "Re-exports should be before exports",
              });
            }
          } else if (isExport(node)) {
            if (lastReExport && node.range[1] < lastReExport.range[0]) {
              context.report({
                node,
                message: "Exports should be after re-exports",
              });
            }

            if (lastNonExport && node.range[1] < lastNonExport.range[0]) {
              context.report({
                node,
                message: "Exports should be after non-exports",
              });
            }
          }
        })
      },
    };
  },
};
