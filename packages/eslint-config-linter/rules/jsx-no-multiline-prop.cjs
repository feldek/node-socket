"use strict";

module.exports = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (!node.attributes.length) {
          return;
        }

        node.attributes.forEach((prop)=> {
          if (prop.loc.start.line !== prop.loc.end.line) {
            context.report({
              node: prop,
              message: "Property should be single line",
            });
          }
        })
      }
    };
  }
};
