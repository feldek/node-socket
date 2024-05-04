"use strict";

/**
 * TODO
 * Probably could replace no-restricted-import
 *
 * Native no-restricted-import can not be merged(at least the way could not be found, need to check again)
 *
 * For example, some imports are restricted for whole repository and some imports are restricted only in specific package
 * Native no-restricted-import in eslint-config-linter will be overwritten by its implementation in specific package
 *
 * This rule must merge both implementations
 */

/**
 * Cases
 *
 * - All imports from "name" are forbidden
 *
 * name: true
 *
 * - All import from "name" are forbidden with "Message"
 *
 * name: "Message"
 *
 * - Import "name" from "name" is forbidden
 *
 * name: [
 *   "name"
 * ]
 *
 * - Import "name" from "name" is forbidden with "Message"
 *
 * name: {
 *   names: [
 *     "name"
 *   ],
 *   message: "Message"
 * }
 *
 * - Import "name" from "name" forbidden with "Name Message" and import "nameTwo" forbidden with "Message"
 *
 * name: {
 *   names: [
 *     {
 *       name: "name,
 *       message: "Name Message"
 *     },
 *     "nameTwo"
 *   ],
 *   message: "Message"
 * }
 */
const COMMON_OPTIONS = {
  "@sb/utils": {
    names: [
      "createParamPropertySelector",
      "createParamOptionalPropertySelector",
      "createPropertySelectorOr",
      "createParamPropertySelectors",
      "toDeprecatedSelector",
    ],
    message: "Check import description"
  },
  "reselect": "Use [createMemoSelector, TSelector] from \"@sb/utils\"",
  "@sb/rorm-records": "Package will be dropped soon - normalize using @sb/graphql-client package and put selector in domain folder",
};

const COMMON_SOURCES = Object.keys(COMMON_OPTIONS);

// TODO merge with options
const createOptions = (options) => [COMMON_OPTIONS, COMMON_SOURCES]

module.exports = {
  create(context) {
    const [options, sources] = createOptions(context.options || {});

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        let sourceOptions = options[sources.find((it)=> source.startsWith(it))];

        if (!sourceOptions) {
          return;
        }

        if (Array.isArray(sourceOptions)) {
          sourceOptions = {
            names: sourceOptions,
          };
        }

        let report = null;

        if (sourceOptions === true) {
          report = {};
        } else if (typeof sourceOptions === "string") {
          report = {
            message: sourceOptions,
          };
        } else {
          node.specifiers.forEach((specifier) => {
            const nameOptions = sourceOptions.names.find((it) => specifier.imported.name.startsWith(it.name || it));

            if (nameOptions) {
              if (!report) {
                report = [];
              }

              report.push({
                node: specifier,
                name: specifier.imported.name,
                message: nameOptions.message || sourceOptions.message,
              });
            }
          })
        }

        if (!report) {
          return;
        }

        if (!Array.isArray(report)) {
          report = [report];
        }

        report.forEach((it) => {
          context.report({
            node: it.node || node,
            message: `Import ${it.name ? `"${it.name}" from ` : ""}is restricted from "${node.source.value}" being used${it.message ? `. ${it.message}` : ""}`,
          })
        });
      },
    };
  },
};
