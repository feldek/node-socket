"use strict";

function isMemoCallExpression(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "MemberExpression") {
    if (
      node.callee.object.type === "Identifier" &&
      node.callee.property.type === "Identifier" &&
      node.callee.object.name === "React" &&
      node.callee.property.name === "memo"
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    node.callee.name === "memo"
  ) {
    return true;
  }

  return false;
}

function isLazyCallExpression(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "MemberExpression") {
    if (
      node.callee.object.type === "Identifier" &&
      node.callee.property.type === "Identifier" &&
      node.callee.object.name === "React" &&
      node.callee.property.name === "lazy"
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    (node.callee.name === "lazy" || node.callee.name === "lazyWithPreload" || node.callee.name === "lazyWithRetry")
  ) {
    return true;
  }

  return false;
}

function isForwardRefCallExpression(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "MemberExpression") {
    if (
      node.callee.object.type === "Identifier" &&
      node.callee.property.type === "Identifier" &&
      node.callee.object.name === "React" &&
      node.callee.property.name === "forwardRef"
    ) {
      return true;
    }
  } else if (
    node.callee.type === "Identifier" &&
    node.callee.name === "forwardRef"
  ) {
    return true;
  }

  return false;
}

function unMemoText(text) {
  let result = text;

  if (text.startsWith("React.memo(")) {
    result = text.slice(11).slice(0, -1);
  } else if (result.startsWith("memo(")) {
    result = text.slice(5).slice(0, -1);
  }

  return result;
}

function memoText(text) {
  return `memo(${text})`;
}

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

    const fixDisabled = !!context.options[0];

    function check(node) {
      let owner = node;

      let name = null;

      let callExpressions = [];

      if (node.type === "FunctionDeclaration") {
        name = node.id.name;
      } else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        owner = node.parent;

        while (owner.type === "CallExpression") {
          callExpressions.push(owner);

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

      // TODO @lebedev Remove this check when ant will be removed
      if (name.endsWith("Renderer")) {
        return;
      }

      const params = node.params;

      if (!params) {
        return;
      }

      const memoIndexes = [];

      callExpressions.forEach((callExpression, index) => {
        if (isMemoCallExpression(callExpression) || isLazyCallExpression(callExpression)) {
          memoIndexes.push(index);
        }
      });

      if (memoIndexes.length > 1) {
        context.report({
          node,
          message: "Component is memoized several times",
        });

        return;
      }

      const forwardRefIndexes = [];

      callExpressions.forEach((callExpression, index) => {
        if (isForwardRefCallExpression(callExpression)) {
          forwardRefIndexes.push(index);
        }
      });

      if (forwardRefIndexes.length > 1) {
        context.report({
          node,
          message: "Component is forwarding ref several times",
        });

        return;
      }

      const memo = callExpressions[memoIndexes[0]];

      const forwardRef = callExpressions[forwardRefIndexes[0]];

      if (memo && forwardRef && forwardRefIndexes[0] > memoIndexes[0]) {
        context.report({
          node,
          message: "React.forwardRef(React.memo(...)) is not allowed. Use React.memo(React.forwardRef(...))",
        });
      }

      function memoNode(fixer) {
        if (forwardRef) {
          return fixer.replaceText(forwardRef, memoText(sourceCode.getText(forwardRef)));
        }

        if (node.type === "FunctionDeclaration") {
          return fixer.replaceText(node, `const ${node.id.name} = ${memoText(sourceCode.getText(node))}`);
        }

        return fixer.replaceText(node, memoText(sourceCode.getText(node)));
      }

      if (!params.length) {
        if (!node.typeParameters && !memo) {
          context.report({
            node,
            message: "Component must be memoized",
            fix: fixDisabled ? undefined : memoNode
          });
        }

        return;
      }

      const [props] = params;

      if (props.type === "ObjectPattern") {
        const hasChildren = props.properties.some((prop) => prop.type === "Property" && prop.key.name === "children");

        if (hasChildren && memo) {
          context.report({
            node,
            message: "Component must not be memoized, because it has children",
            fix: fixDisabled ? undefined : function (fixer) {
              return fixer.replaceText(memo, unMemoText(sourceCode.getText(memo)));
            }
          });
        }

        if (!node.typeParameters && !hasChildren && !memo) {
          context.report({
            node,
            message: "Component must be memoized",
            fix: fixDisabled ? undefined : memoNode
          });
        }

        return;
      }

      if (!node.typeParameters && !memo) {
        context.report({
          node,
          message: "Component must be memoized",
          fix: fixDisabled ? undefined : memoNode
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
