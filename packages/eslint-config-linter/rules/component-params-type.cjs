"use strict";

function isMemoCallExpression(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "MemberExpression") {
    if (
      node.callee.object.type === "Identifier" &&
      node.callee.property.type === "Identifier" &&
      node.callee.object.name === "React" &&
      (node.callee.property.name === "memo" || node.callee.property.name === "forwardRef")
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    (node.callee.name === "memo" || node.callee.name === "forwardRef")
  ) {
    return true;
  }

  return false;
}

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    const [fileExtension] = context.getFilename().split(".").slice(-1);

    const isJSXFile = ["jsx", "tsx"].includes(fileExtension);

    if (!isJSXFile) {
      return {};
    }

    function check(node) {
      let owner = node;

      let name = null;

      let callExpressions = [];

      if (node.type === "FunctionDeclaration") {
        name = node.id.name;
      } else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        owner = node.parent;

        while (owner.type === "CallExpression") {
          callExpressions.push(owner);

          owner = owner.parent;
        }

        if (owner.type === "VariableDeclarator") {
          name = owner.id.name;

          owner = owner.parent;
        }
      }

      if (!name || !/^[^a-z]/.test(name)) {
        return;
      }

      const params = node.params;

      if (!params) {
        return;
      }

      const memo = callExpressions.find(isMemoCallExpression);

      if (memo) {

        if (memo.typeParameters) {
          memo.typeParameters.params.forEach((param) => {
            if (param.type === "TSTypeLiteral") {
              context.report({
                node,
                message: "Type literal is forbidden. Use interface definition instead",
              });
            }
          });
        }

        memo.arguments.forEach((argument) => {
          if (argument.params) {
            argument.params.forEach((param) => {
              if (param.typeAnnotation) {
                context.report({
                  node,
                  message: "Type annotation is forbidden. Use generic instead",
                });
              }
            })
          }
        })
      }
    }

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
};
