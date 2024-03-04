/**
 * Forked no-unnecessary-condition rule with minor changes to prevent falsy positive reports
 */
const {AST_NODE_TYPES, AST_TOKEN_TYPES, ASTUtils, ESLintUtils} = require('@typescript-eslint/utils');
const tsutils = require('ts-api-utils');
const ts = require('typescript')

const {
  getConstrainedTypeAtLocation,
  getTypeName,
  getTypeOfPropertyOfName,
  isNullableType,
  isTypeFlagSet,
} = require("@typescript-eslint/type-utils");

// Nullish utilities
const nullishFlag = ts.TypeFlags.Undefined | ts.TypeFlags.Null;
const isNullishType = (type) =>
  isTypeFlagSet(type, nullishFlag);

const isPossiblyNullish = (type) =>
  tsutils.unionTypeParts(type).some(isNullishType);

const isAlwaysNullish = (type) =>
  tsutils.unionTypeParts(type).every(isNullishType);

// isLiteralType only covers numbers and strings, this is a more exhaustive check.
const isLiteral = (type) =>
  tsutils.isBooleanLiteralType(type) ||
  type.flags === ts.TypeFlags.Undefined ||
  type.flags === ts.TypeFlags.Null ||
  type.flags === ts.TypeFlags.Void ||
  type.isLiteral();
// #endregion


module.exports = {
  name: 'no-unnecessary-condition',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow conditionals where the type is always truthy or always falsy',
      recommended: 'strict',
      requiresTypeChecking: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowConstantLoopConditions: {
            description:
              'Whether to ignore constant loop conditions, such as `while (true)`.',
            type: 'boolean',
          },
          allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: {
            description:
              'Whether to not error when running with a tsconfig that has strictNullChecks turned.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: 'code',
    messages: {
      neverOptionalChain: 'Unnecessary optional chain on a non-nullish value.',
      noStrictNullCheck:
        'This rule requires the `strictNullChecks` compiler option to be turned on to function correctly.',
    },
  },
  create(
    context,
  ) {
    const options = context.options[0] || {};
    const {enableFix} = options;
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const sourceCode = context.sourceCode;
    const compilerOptions = services.program.getCompilerOptions();
    const isStrictNullChecks = tsutils.isStrictCompilerOptionEnabled(
      compilerOptions,
      'strictNullChecks',
    );

    // if (
    //   !isStrictNullChecks
    // ) {
    //   context.report({
    //     loc: {
    //       start: {line: 0, column: 0},
    //       end: {line: 0, column: 0},
    //     },
    //     messageId: 'noStrictNullCheck',
    //   });
    // }

    function nodeIsArrayType(node) {
      const nodeType = getConstrainedTypeAtLocation(services, node);
      return checker.isArrayType(nodeType);
    }

    function nodeIsTupleType(node) {
      const nodeType = getConstrainedTypeAtLocation(services, node);
      return checker.isTupleType(nodeType);
    }

    function isArrayIndexExpression(node) {
      return (
        // Is an index signature
        node.type === AST_NODE_TYPES.MemberExpression &&
        node.computed &&
        // ...into an array type
        (nodeIsArrayType(node.object) ||
          // ... or a tuple type
          (nodeIsTupleType(node.object) &&
            // Exception: literal index into a tuple - will have a sound type
            node.property.type !== AST_NODE_TYPES.Literal))
      );
    }

    // Recursively searches an optional chain for an array index expression
    //  Has to search the entire chain, because an array index will "infect" the rest of the types
    //  Example:
    //  ```
    //  [{x: {y: "z"} }][n] // type is {x: {y: "z"}}
    //    ?.x // type is {y: "z"}
    //    ?.y // This access is considered "unnecessary" according to the types
    //  ```
    function optionChainContainsOptionArrayIndex(
      node,
    ) {
      const lhsNode =
        node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.object;
      if (node.optional && isArrayIndexExpression(lhsNode)) {
        return true;
      }
      if (
        lhsNode.type === AST_NODE_TYPES.MemberExpression ||
        lhsNode.type === AST_NODE_TYPES.CallExpression
      ) {
        return optionChainContainsOptionArrayIndex(lhsNode);
      }
      return false;
    }

    function isNullablePropertyType(
      objType,
      propertyType,
    ) {
      if (propertyType.isUnion()) {
        return propertyType.types.some(type =>
          isNullablePropertyType(objType, type),
        );
      }
      if (propertyType.isNumberLiteral() || propertyType.isStringLiteral()) {
        const propType = getTypeOfPropertyOfName(
          checker,
          objType,
          propertyType.value.toString(),
        );
        if (propType) {
          return isNullableType(propType, {allowUndefined: true});
        }
      }
      const typeName = getTypeName(checker, propertyType);
      return !!checker
        .getIndexInfosOfType(objType)
        .find(info => getTypeName(checker, info.keyType) === typeName);
    }

    // Checks whether a member expression is nullable or not regardless of it's previous node.
    //  Example:
    //  ```
    //  // 'bar' is nullable if 'foo' is null.
    //  // but this function checks regardless of 'foo' type, so returns 'true'.
    //  declare const foo: { bar : { baz: string } } | null
    //  foo?.bar;
    //  ```
    function isNullableOriginFromPrev(
      node,
    ) {
      const prevType = getConstrainedTypeAtLocation(services, node.object);
      const property = node.property;
      if (prevType.isUnion() && ASTUtils.isIdentifier(property)) {
        const isOwnNullable = prevType.types.some(type => {
          if (node.computed) {
            const propertyType = getConstrainedTypeAtLocation(
              services,
              node.property,
            );
            return isNullablePropertyType(type, propertyType);
          }
          const propType = getTypeOfPropertyOfName(
            checker,
            type,
            property.name,
          );

          if (propType) {
            return isNullableType(propType, {allowUndefined: true});
          }

          return !!checker.getIndexInfoOfType(type, ts.IndexKind.String);
        });
        return (
          !isOwnNullable && isNullableType(prevType, {allowUndefined: true})
        );
      }
      return false;
    }

    function isOptionableExpression(node) {
      const type = getConstrainedTypeAtLocation(services, node);
      const isOwnNullable =
        node.type === AST_NODE_TYPES.MemberExpression
          ? !isNullableOriginFromPrev(node)
          : true;
      const possiblyVoid = isTypeFlagSet(type, ts.TypeFlags.Void);
      return (
        isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown) ||
        (isOwnNullable &&
          (isNullableType(type, {allowUndefined: true}) || possiblyVoid))
      );
    }

    function checkOptionalChain(
      node,
      beforeOperator,
      fix,
    ) {
      // We only care if this step in the chain is optional. If just descend
      // from an optional chain, then that's fine.
      if (!node.optional) {
        return;
      }

      // Since typescript array index signature types don't represent the
      //  possibility of out-of-bounds access, if we're indexing into an array
      //  just skip the check, to avoid false positives
      if (optionChainContainsOptionArrayIndex(node)) {
        return;
      }

      const nodeToCheck =
        node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.object;

      if (isOptionableExpression(nodeToCheck)) {
        return;
      }

      const questionDotOperator = ESLintUtils.nullThrows(
        sourceCode.getTokenAfter(
          beforeOperator,
          token =>
            token.type === AST_TOKEN_TYPES.Punctuator && token.value === '?.',
        ),
        ESLintUtils.NullThrowsReasons.MissingToken('operator', node.type),
      );

      context.report({
        node,
        loc: questionDotOperator.loc,
        messageId: 'neverOptionalChain',
        fix(fixer) {
          /**
           * For now it is dangerous to enable fix option by default because way to much incorrect typings
           */
          return enableFix ?
            fixer.replaceText(questionDotOperator, fix)
            : null;
        },
      });
    }

    function checkOptionalMemberExpression(
      node,
    ) {
      checkOptionalChain(node, node.object, node.computed ? '' : '.');
    }

    function checkOptionalCallExpression(node) {
      checkOptionalChain(node, node.callee, '');
    }

    return {
      'MemberExpression[optional = true]': checkOptionalMemberExpression,
      'CallExpression[optional = true]': checkOptionalCallExpression,
    };
  },
};
