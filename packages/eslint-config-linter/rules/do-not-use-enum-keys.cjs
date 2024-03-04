"use strict";

const isNamedLikeEnum = (name) => /^E[A-Z0-9]/.test(name);

module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.object &&
          node.callee.object.name === "Object" &&
          node.callee.property &&
          node.callee.property.name === "keys" &&
          isNamedLikeEnum(node.arguments[0].name)
        ) {
          context.report({
            node: node.callee.property,
            message: "Do not use enum keys",
          });
        }
      },
      ForInStatement(node) {
        if (isNamedLikeEnum(node.right.name)) {
          context.report({
            node,
            message: "Do not use enum keys",
          })
        }
      }
    };
  }
};
