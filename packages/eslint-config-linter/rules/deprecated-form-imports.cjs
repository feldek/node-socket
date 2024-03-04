function isDeprecatedFormPathUsed(node) {
  const { value } = node.source;

  if (value.startsWith("@sb/form") && !value.startsWith("@sb/form-new")) {
    return true;
  }
}

// TODO remove this rule after package `@sb-form` will be deleted
module.exports = {
  create(context) {
    return {
      ImportDeclaration(node) {
        if (isDeprecatedFormPathUsed(node)) {
          context.report({
            node,
            message: "Use @sb/form-new",
          });
        }
      },
    };
  }
};
