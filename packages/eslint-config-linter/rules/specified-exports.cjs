"use strict";

module.exports = {
  meta: {
    fixable: 'code',
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    const lastNode = sourceCode.ast.body[sourceCode.ast.body.length - 1];
    const namedExports = {type: [], value: []};
    const specifiedExports = {type: [], value: []};

    sourceCode.ast.body.forEach((n) => {
      if (n.type === "ExportNamedDeclaration" && n.declaration) {
        namedExports[n.exportKind].push(n);
      }
    });

    sourceCode.ast.body.forEach((n) => {
      if (n.type === "ExportNamedDeclaration" && !n.declaration && !n.source) {
        specifiedExports[n.exportKind].push(n);
      }
    });

    return {
      ExportNamedDeclaration(node) {
        if (Object.values(specifiedExports).some((s) => s.length > 1)) {
          context.report({
            node,
            message: "Only one specified export allowed",
          });
        }

        if (node.declaration) {
          context.report({
            node,
            message: "Named exports are not allowed. Use specified export instead",
            fix(fixer) {
              const specifiedExport = specifiedExports[node.exportKind].length && specifiedExports[node.exportKind][0];
              const last = namedExports[node.exportKind][namedExports[node.exportKind].length - 1] === node;

              const exportPostfix = node.exportKind === "type"
                ? " type"
                : "";

              const fixers = [
                fixer.replaceText(node, sourceCode.getText(node).split("export ").slice(1).join("")),
              ];

              if (last) {
                const names = namedExports[node.exportKind]
                  .map((declaration) => {
                    if (declaration.declaration.declarations) {
                      return declaration.declaration.declarations.map((d) => d.id.name);
                    } else {
                      return declaration.declaration.id.name;
                    }
                  })
                  .reduce((acc, cur) => {
                    if (Array.isArray(cur)) {
                      return [...acc, ...cur];
                    } else {
                      return [...acc, cur];
                    }
                  }, []);

                if (specifiedExport) {
                  fixers.push(fixer.remove(specifiedExport));

                  names.unshift(...specifiedExport.specifiers.map((specifier) => {
                    if (specifier.local.name === specifier.exported.name) {
                      return specifier.local.name;
                    } else {
                      return `${specifier.local.name} as ${specifier.exported.name}`;
                    }
                  }));
                }

                fixers.push(fixer.insertTextAfter(lastNode, `\n\nexport${exportPostfix} { ${names.join(", ")} };`));
              }

              return fixers;
            }
          });
        }
      },
    };
  }
};
