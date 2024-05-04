"use strict";

const maxLines = 50;

module.exports = {
  meta: {
    fixable: 'code',
  },
  create: function (context) {
    let program = null;

    function disable(node) {
      if (program) {
        return;
      }

      const lines = node.loc.end.line - node.loc.start.line;

      if (lines > maxLines) {
        let parent = node.parent;

        while (!program) {
          if (parent.type === "Program") {
            program = parent;
          } else {
            parent = parent.parent;
          }
        }

        context.report({
          node,
          message: `Element length must be less than or equal to ${maxLines} lines. Current length is ${lines}. Split element into separate components`,
          fix(fixer) {
            return fixer.replaceText(program, `/* eslint-disable rulesdir/jsx-element-max-length */\n${context.getSourceCode().getText(program)}`);
          }
        });
      }
    }

    function check(node) {
      const lines = node.loc.end.line - node.loc.start.line + 1;

      if (lines > maxLines) {
        context.report({
          node,
          message: `Element length must be less than or equal to ${maxLines} lines. Current length is ${lines}. Split element into separate components`,
        });
      }
    }

    return {
      JSXElement: check,
      JSXFragment: check
    };
  }
};
