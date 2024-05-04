"use strict";

module.exports = {
  create(context) {
    function check(node) {
      node.properties.forEach((prop) => {
        if (
          prop.key && prop.key.type === "ConditionalExpression" &&
          prop.key.loc.start.line !== prop.key.loc.end.line
        ) {
          context.report({
            node: prop,
            message: "Object key must be single line",
          });
        }
      });
    }

    return {
      ObjectExpression: check,
    };
  }
};
