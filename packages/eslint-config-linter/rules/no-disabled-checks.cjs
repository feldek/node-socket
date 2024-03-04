"use strict";

module.exports = {
  create(context) {
    const sourceCode = context.getSourceCode();

    return {
      Program() {
        sourceCode.getAllComments().forEach((node) => {
          if (node.value.includes("@ts-ignore") || node.value.includes("@ts-nocheck")) {
            context.report({
              node: node,
              message: "No \"@ts-ignore\" allowed",
            });
          }

          if (node.value.includes("@ts-nocheck")) {
            context.report({
              node: node,
              message: "No \"@ts-nocheck\" allowed",
            });
          }

          if (node.value.includes("eslint-disable")) {
            context.report({
              node: node,
              message: "No \"eslint-disable\" allowed",
            });
          }
        });
      },
    };
  }
};
