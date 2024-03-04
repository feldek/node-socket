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

      return /^I[A-Z0-9]/.test(name);
    }

    function withPostfix(name) {
      if (typeof name !== "string") {
        return false;
      }

      return /[A-Z0-9]*Interface$/.test(name);
    }

    function checkInterface(node) {
      if (
        node.parent.type === "TSModuleBlock" &&
        node.parent.parent.type === "TSModuleDeclaration" &&
        node.parent.parent.kind === "global"
      ) {
        return;
      }

      if (!withPrefix(node.id.name)) {
        context.report({
          node: node.id,
          message: `Interface name "${node.id.name}" must be with prefix "I".`,
        });
      }

      if (withPostfix(node.id.name)) {
        context.report({
          node: node.id,
          message: `Interface name "${node.id.name}" must be without postfix "Interface".`,
        });
      }
    }

    return {
      TSInterfaceDeclaration: checkInterface,
    };
  },
};
