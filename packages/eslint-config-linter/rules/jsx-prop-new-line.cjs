"use strict";

const maximum = 3;

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    function generateFixFunction(line) {
      const sourceCode = context.getSourceCode();
      const output = [];
      const front = line[0].range[0];
      const back = line[line.length - 1].range[1];

      for (let i = 0; i < line.length; i += 1) {
        const nodes = line.slice(i, i + 1);

        output.push(nodes.reduce((prev, curr) => {
          if (prev === "") {
            return sourceCode.getText(curr);
          }

          return `${prev} ${sourceCode.getText(curr)}`;
        }, ""));
      }

      const code = output.join("\n");

      return function fix(fixer) {
        return fixer.replaceTextRange([front, back], code);
      };
    }

    return {
      JSXOpeningElement(node) {
        if (!node.attributes.length) {
          return;
        }

        const firstProp = node.attributes[0];
        const lastProp = node.attributes[node.attributes.length - 1];
        const multiline = firstProp.loc.start.line !== lastProp.loc.start.line ||
          node.attributes.some((prop) => prop.loc.start.line !== prop.loc.end.line);

        if (!multiline && node.attributes.length <= maximum) {
          return;
        }

        if (firstProp.loc.start.line === node.loc.start.line) {
          context.report({
            node: firstProp,
            message: "Property should be placed on a new line",
            fix(fixer) {
              return fixer.replaceTextRange([node.name.range[1], firstProp.range[0]], "\n");
            }
          });
        }

        const linePartitionedProps = [[firstProp]];

        node.attributes.reduce((last, decl) => {
          if (last.loc.end.line === decl.loc.start.line) {
            linePartitionedProps[linePartitionedProps.length - 1].push(decl);
          } else {
            linePartitionedProps.push([decl]);
          }

          return decl;
        });

        linePartitionedProps.forEach((propsInLine) => {
          if (propsInLine.length > 1) {
            context.report({
              node: propsInLine[1],
              message: "Property should be placed on a new line",
              fix: generateFixFunction(propsInLine)
            });
          }
        });
      }
    };
  }
};
