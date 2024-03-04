"use strict";

module.exports = {
  create(context) {
    const handleAssignmentPattern = (node) => {
      if (
        node.right.type === "Literal" &&
        node.right.value === true
      ) {
        context.report({
          node,
          message: "Default assign of \"true\" is forbidden",
        });
      }
    }

    const handleFunction = (node) => {
      if (node.params.length === 0) {
        return;
      }

      node.params.forEach((param) => {
        if (param.type === "AssignmentPattern") {
          handleAssignmentPattern(param)

          return;
        }

        if (param.type === "ObjectPattern") {
          param.properties.forEach((property) => {
            if (
              property.type === "Property" &&
              property.value.type === "AssignmentPattern"
            ) {
              handleAssignmentPattern(property.value)
            }
          })
        }
      })
    };

    return {
      FunctionDeclaration: handleFunction,

      FunctionExpression: handleFunction,

      ArrowFunctionExpression: handleFunction,
    };
  },
};
