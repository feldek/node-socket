"use strict";

function isLineBreak(str) {
  let lineBreaksFound = 0;
  let spaceFound = false;

  for (const char of str) {
    if (char === "\n") {
      if (spaceFound) {
        return false;
      }

      lineBreaksFound++;
    } else if (char === " ") {
      spaceFound = true;
    } else {
      return false;
    }
  }

  return lineBreaksFound > 1;
}

function trimLineBreak(str) {
  return `\n${str.split("\n").join("")}`;
}

module.exports = {
  meta: {
    fixable: 'code',
  },
  create: function (context) {
    function nodeKey(node) {
      return `${node.loc.start.line},${node.loc.start.column}`;
    }

    function nodeDescriptor(n) {
      return n.openingElement
        ? n.openingElement.name.name
        : context.getSourceCode().getText(n).replace(/\n/g, "");
    }

    function handleJSX(node) {
      const { children } = node;

      if (!children || !children.length) {
        return;
      }

      const [firstChild] = children;

      if (firstChild.value && isLineBreak(firstChild.value)) {
        context.report({
          node: firstChild,
          message: "Unnecessary empty line",
          fix(fixer) {
            return fixer.replaceText(firstChild, trimLineBreak(firstChild.value));
          }
        })
      }

      const lastChild = children[children.length - 1];

      if (lastChild.value && isLineBreak(lastChild.value)) {
        context.report({
          node: lastChild,
          message: "Unnecessary empty line",
          fix(fixer) {
            return fixer.replaceText(lastChild, trimLineBreak(lastChild.value));
          }
        })
      }

      const openingElement = node.openingElement || node.openingFragment;
      const closingElement = node.closingElement || node.closingFragment;
      const openingElementStartLine = openingElement.loc.start.line;
      const openingElementEndLine = openingElement.loc.end.line;
      const closingElementStartLine = closingElement.loc.start.line;
      const closingElementEndLine = closingElement.loc.end.line;

      if (children.length === 1) {
        const [child] = children;

        if (child.type === "Literal" || child.type === "JSXText") {
          return;
        }

        if (
          child.type !== "JSXElement"
          && openingElementStartLine === openingElementEndLine
          && openingElementEndLine === closingElementStartLine
          && closingElementStartLine === closingElementEndLine
          && closingElementEndLine === child.loc.start.line
          && child.loc.start.line === child.loc.end.line
        ) {
          return;
        }
      }

      const childrenGroupedByLine = {};
      const fixDetailsByNode = {};

      children.forEach((child) => {
        let countNewLinesBeforeContent = 0;
        let countNewLinesAfterContent = 0;

        if (child.type === "Literal" || child.type === "JSXText") {
          if (typeof child.value === "string" && /^\s*$/.test(child.value)) {
            return;
          }

          countNewLinesBeforeContent = (child.value.match(/^\s*\n/g) || []).length;
          countNewLinesAfterContent = (child.value.match(/\n\s*$/g) || []).length;
        }

        const startLine = child.loc.start.line + countNewLinesBeforeContent;
        const endLine = child.loc.end.line - countNewLinesAfterContent;

        if (startLine === endLine) {
          if (!childrenGroupedByLine[startLine]) {
            childrenGroupedByLine[startLine] = [];
          }

          childrenGroupedByLine[startLine].push(child);
        } else {
          if (!childrenGroupedByLine[startLine]) {
            childrenGroupedByLine[startLine] = [];
          }

          childrenGroupedByLine[startLine].push(child);

          if (!childrenGroupedByLine[endLine]) {
            childrenGroupedByLine[endLine] = [];
          }

          childrenGroupedByLine[endLine].push(child);
        }
      });

      Object.keys(childrenGroupedByLine).forEach((_line) => {
        const line = parseInt(_line, 10);
        const firstIndex = 0;
        const lastIndex = childrenGroupedByLine[line].length - 1;

        childrenGroupedByLine[line].forEach((child, i) => {
          let prevChild;
          let nextChild;

          if (i === firstIndex) {
            if (line === openingElementEndLine) {
              prevChild = openingElement;
            }
          } else {
            prevChild = childrenGroupedByLine[line][i - 1];
          }

          if (i === lastIndex) {
            if (line === closingElementStartLine) {
              nextChild = closingElement;
            }
          }

          function spaceBetweenPrev() {
            return ((prevChild.type === "Literal" || prevChild.type === "JSXText") && / $/.test(prevChild.value))
              || ((child.type === "Literal" || child.type === "JSXText") && /^ /.test(child.value))
              || context.getSourceCode().isSpaceBetweenTokens(prevChild, child);
          }

          function spaceBetweenNext() {
            return ((nextChild.type === "Literal" || nextChild.type === "JSXText") && /^ /.test(nextChild.value))
              || ((child.type === "Literal" || child.type === "JSXText") && / $/.test(child.value))
              || context.getSourceCode().isSpaceBetweenTokens(child, nextChild);
          }

          if (!prevChild && !nextChild) {
            return;
          }

          const source = context.getSourceCode().getText(child);
          const leadingSpace = !!(prevChild && spaceBetweenPrev());
          const trailingSpace = !!(nextChild && spaceBetweenNext());
          const leadingNewLine = !!prevChild;
          const trailingNewLine = !!nextChild;

          const key = nodeKey(child);

          if (!fixDetailsByNode[key]) {
            fixDetailsByNode[key] = {
              node: child,
              source,
              descriptor: nodeDescriptor(child)
            };
          }

          if (leadingSpace) {
            fixDetailsByNode[key].leadingSpace = true;
          }
          if (leadingNewLine) {
            fixDetailsByNode[key].leadingNewLine = true;
          }
          if (trailingNewLine) {
            fixDetailsByNode[key].trailingNewLine = true;
          }
          if (trailingSpace) {
            fixDetailsByNode[key].trailingSpace = true;
          }
        });
      });

      Object.keys(fixDetailsByNode).forEach((key) => {
        const details = fixDetailsByNode[key];

        const nodeToReport = details.node;
        const descriptor = details.descriptor;
        const source = details.source.replace(/(^ +| +(?=\n)*$)/g, "");

        const leadingSpaceString = details.leadingSpace ? "\n{\" \"}" : "";
        const trailingSpaceString = details.trailingSpace ? "{\" \"}\n" : "";
        const leadingNewLineString = details.leadingNewLine ? "\n" : "";
        const trailingNewLineString = details.trailingNewLine ? "\n" : "";

        const replaceText = `${leadingSpaceString}${leadingNewLineString}${source}${trailingNewLineString}${trailingSpaceString}`;

        context.report({
          node: nodeToReport,
          message: `${descriptor} must be placed on new line`,
          fix(fixer) {
            return fixer.replaceText(nodeToReport, replaceText);
          }
        });
      });
    }

    return {
      JSXElement: handleJSX,
      JSXFragment: handleJSX
    };
  }
};
