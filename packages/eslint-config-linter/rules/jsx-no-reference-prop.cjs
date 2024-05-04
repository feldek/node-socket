"use strict";

function isReference(node) {
  if (
    node.type === "ObjectExpression" ||
    node.type === "ArrayExpression" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return true;
  }

  if (node.type === "LogicalExpression") {
    return isReference(node.left) || isReference(node.right)
  }

  if (node.type === "ConditionalExpression") {
    return isReference(node.consequent) || isReference(node.alternate)
  }

  return false;
}

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    let program = null;

    function disable(node) {
      if (program) {
        return;
      }

      node.attributes.forEach((prop) => {
        const { type, value } = prop;

        if (type === "JSXAttribute" && value) {
          if (value.type === "JSXExpressionContainer") {
            const { expression } = value;

            if (isReference(expression)) {
              let parent = node.parent;

              while (!program) {
                if (parent.type === "Program") {
                  program = parent;
                } else {
                  parent = parent.parent;
                }
              }

              context.report({
                node: prop,
                message: "Property must not be of a reference type",
                fix(fixer) {
                  return fixer.replaceText(program, `/* eslint-disable rulesdir/jsx-no-reference-prop */\n${context.getSourceCode().getText(program)}`);
                }
              });
            }
          }
        }
      });
    }

    function check(node) {
      node.attributes.forEach((prop) => {
        const { type, value } = prop;

        if (type === "JSXAttribute" && value) {
          if (value.type === "JSXExpressionContainer") {
            const { expression } = value;

            if (isReference(expression)) {
              context.report({
                node: prop,
                message: "Property must not be of a reference type",
              });
            }
          }
        }
      });
    }

    return {
      JSXOpeningElement: check,
    };
  }
};
