"use strict";

module.exports = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (!node.attributes.length) {
          return;
        }

        const spreadPropsIndexes = [];

        node.attributes.forEach((prop, index) => {
          if (prop.type === "JSXSpreadAttribute") {
            spreadPropsIndexes.push(index);
          }
        });

        if (spreadPropsIndexes.length === 0) {
          return;
        }

        node.attributes.forEach((prop, index) => {
          if (
            prop.name &&
            prop.name.name === "key" &&
            spreadPropsIndexes.some((spreadPropIndex) => spreadPropIndex > index)
          ) {
            context.report({
              node: prop,
              message: "Key should be placed after spread prop",
            });
          }
        });
      }
    };
  }
};
