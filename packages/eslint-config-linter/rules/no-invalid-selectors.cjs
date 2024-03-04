"use strict";

const isFunction = (node) => node.type === "FunctionDeclaration" ||
  node.type === "FunctionExpression" ||
  node.type === "ArrowFunctionExpression";

const hasStateParam = (node) => node
  .params
  ?.some((param) => /(^_?(s|([Ss])tate)$)|([a-z0-9]?([Ss])tate)/.test(param.name));

const isSelectorName = (node) => /^select|selector(factory)?$/i.test(node.name);

const isSelectorFactoryName = (node) => /^[A-Za-z]+SelectorFactory$/.test(node.name);

const isSpecificName = (node, checker) => {
  if (node.type === "FunctionDeclaration") {
    return checker(node.id);
  }

  if (node.parent.type === "VariableDeclarator") {
    return checker(node.parent.parent.declarations[0].id);
  }

  return false;
};

const getParentFunc = (node) => {
  if (node.parent.type === "Program") {
    return null;
  }

  if (isFunction(node.parent)) {
    return node.parent;
  }

  return getParentFunc(node.parent);
};

const isSelector = (node) => {
  if (
    !isFunction(node) ||
    !hasStateParam(node)
  ) {
    return false;
  }

  let parentFunc = getParentFunc(node);

  if (!parentFunc) {
    return true;
  }

  while (parentFunc) {
    if (isSpecificName(parentFunc, isSelectorName)) {
      return true;
    }

    parentFunc = getParentFunc(parentFunc);
  }

  return false;
};

const isValidSelector = (node) => {
  let parentFunc = getParentFunc(node);

  if (!parentFunc) {
    return true;
  }

  return isSpecificName(parentFunc, isSelectorFactoryName);
}

module.exports = {
  create(context) {
    const report = (node) => {
      context.report({
        node,
        message: "Selector can only be created at the root of a file or in a selector factory",
      });
    };

    const handleCallExpression = (node) => {
      if (/create[A-Za-z]+Selectors?/.test(node.callee.name)) {
        if (isValidSelector(node)) {
          return;
        }

        report(node);
      }
    };

    const handleBlockStatement = (node) => {
      const returnStatement = node.body.body.find((bodyNode) => bodyNode.type === "ReturnStatement");

      if (!returnStatement?.argument) {
        return;
      }

      if (returnStatement.argument.type === "CallExpression") {
        handleCallExpression(returnStatement.argument);
      }
    }

    const handleSelector = (node) => {
      if (isValidSelector(node)) {
        return;
      }

      report(node);
    };

    return {
      ArrowFunctionExpression(node) {
        if (node.body.type === "CallExpression") {
          handleCallExpression(node.body)
        }

        if (node.body.type === "BlockStatement") {
          handleBlockStatement(node);
        }

        if (isSelector(node)) {
          handleSelector(node);
        }
      },
      FunctionDeclaration(node) {
        if (node.body.type === "BlockStatement") {
          handleBlockStatement(node);
        }
      },
      FunctionExpression(node) {
        if (node.body.type === "BlockStatement") {
          handleBlockStatement(node);
        }

        if (isSelector(node)) {
          handleSelector(node);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          !isSelectorFactoryName(node.callee)
        ) {
          return;
        }

        if (
          node.parent.type === "VariableDeclarator" &&
          node.parent.parent.type === "VariableDeclaration" &&
          node.parent.parent.parent.type === "Program"
        ) {
          return;
        }

        context.report({
          node,
          message: "Selector factory can only be called at the root of a file",
        });
      },
    }
  },
};
