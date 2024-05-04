"use strict";

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    function withPrefix(name) {
      if (typeof name !== "string") {
        return false;
      }

      return /^T[A-Z0-9]/.test(name);
    }

    function checkType(typeNode) {
      if (!withPrefix(typeNode.id.name)) {
        context.report({
          node: typeNode.id,
          message: `Type name "${typeNode.id.name}" must be with prefix "T".`,
        });
      }
    }

    return {
      TSTypeAliasDeclaration: checkType,
    };
  },
};
