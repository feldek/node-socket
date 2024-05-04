"use strict";

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    const [fileExtension] = context.getFilename().split(".").slice(-1);

    const isJSXFile = ["jsx", "tsx"].includes(fileExtension);

    if (!isJSXFile) {
      return {};
    }

    const sourceCode = context.getSourceCode();

    function check(node) {
      let owner = node;

      let name = null;

      if (node.type === "FunctionDeclaration") {
        name = node.id.name;
      } else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        owner = node.parent;

        while (owner.type === "CallExpression") {
          if (
            owner.callee.type === "Identifier" &&
            (owner.callee.name === "lazy" || owner.callee.name === "lazyWithPreload" || owner.callee.name === "lazyWithRetry")
          ) {
            return;
          }

          owner = owner.parent;
        }

        if (owner.type === "VariableDeclarator") {
          name = owner.id.name;

          owner = owner.parent;
        }
      }

      if (!name || !/^[A-Z][a-z]/.test(name)) {
        return;
      }

      let scopeNodes = owner.parent && owner.parent.body;

      if (!scopeNodes) {
        return;
      }

      // TODO if function return JSX - report without fix (can be strange strange function, like configurations property render in adminui)

      const displayNameAssignments = scopeNodes.filter((n) => (
        n.type === "ExpressionStatement" &&
        n.expression.type === "AssignmentExpression" &&
        n.expression.operator === "=" &&
        n.expression.left.type === "MemberExpression" &&
        n.expression.left.object.name === name &&
        n.expression.left.property.name === "displayName"
      ));

      if (displayNameAssignments.length > 1) {
        context.report({
          node: displayNameAssignments[1],
          message: "Only one display name assigment per component is allowed",
        });

        return;
      }

      const displayNameAssignment = displayNameAssignments[0];

      if (!displayNameAssignment) {
        context.report({
          node: owner,
          message: "No display name assignment",
          fix(fixer) {
            return fixer.insertTextAfter(owner, `\n${name}.displayName = "${name}"`);
          }
        });

        return;
      }

      if (displayNameAssignment.expression.right.value !== name) {
        context.report({
          node: displayNameAssignment,
          message: "Display name assignment must be of the same name",
          fix(fixer) {
            return fixer.replaceTextRange(displayNameAssignment.range, `${name}.displayName = "${name}"`)
          }
        });

        return;
      }

      if (displayNameAssignment.loc.start.line !== owner.loc.end.line + 1) {
        context.report({
          node: displayNameAssignment,
          message: "Display name assignment must be on the next line after the component",
          fix(fixer) {
            const linesBetween = sourceCode.lines.slice(owner.loc.end.line, displayNameAssignment.loc.start.line - 1);

            if (linesBetween.length && linesBetween.every((line) => !line.trim().length)) {
              return fixer.replaceTextRange([owner.range[1], displayNameAssignment.range[0]], "\n")
            }

            return [
              fixer.removeRange(displayNameAssignment.range),
              fixer.insertTextAfter(owner, `\n${sourceCode.getText(displayNameAssignment)}`),
            ];
          }
        });
      }
    }

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
};
