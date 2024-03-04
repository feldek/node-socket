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

      return /^E[A-Z0-9]/.test(name);
    }

    function withPostfix(name) {
      if (typeof name !== "string") {
        return false;
      }

      return /[A-Z0-9]*Enum$/.test(name);
    }

    function checkEnum(enumNode) {
      if (!withPrefix(enumNode.id.name)) {
        context.report({
          node: enumNode.id,
          message: `Enum name "${enumNode.id.name}" must be with prefix "E".`,
        });
      }

      if (withPostfix(enumNode.id.name)) {
        context.report({
          node: enumNode.id,
          message: `Enum name "${enumNode.id.name}" must be without postfix "Enum".`,
        });
      }
    }

    return {
      TSEnumDeclaration: checkEnum,
    };
  },
};
