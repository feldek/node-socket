"use strict";

function isEmptyLinesBetween(sourceCode, previous, current) {
  const linesBetweenImports = sourceCode.lines.slice(previous.loc.end.line, current.loc.start.line - 1);

  if (linesBetweenImports.length === 0) {
    return false;
  }

  return linesBetweenImports.every((line) => !line.trim().length);
}

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    let previousDeclaration = null;

    return {
      ImportDeclaration(node) {
        if (previousDeclaration && isEmptyLinesBetween(sourceCode, previousDeclaration, node)) {
          context.report({
            node,
            message: "No empty lines between imports",
            fix(fixer) {
              return fixer.replaceTextRange([previousDeclaration.range[1], node.range[0]], "\n");
            }
          });
        }

        previousDeclaration = node;
      }
    };
  }
};
