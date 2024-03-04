"use strict";

const checkSource = (source, value) => {
  const lowerValue = value.toLowerCase();

  if (source instanceof RegExp) {
    if (!source.ignoreCase) {
      throw new Error("[no-forbidden-relative-imports] RegExp must be case insensitive")
    }

    return source.test(lowerValue);
  }

  return lowerValue.includes(`/${source.toLowerCase()}/`);
};

module.exports = {
  create(context) {
    const filename = context.getFilename();

    const options = context.options[0].filter((it) => checkSource(it.source, filename))

    if (options.length === 0) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (!source.startsWith(".")) {
          return;
        }

        options.forEach((option) => {
          option.from.forEach((it) => {
            const forbidden = checkSource(it, source);

            if (!forbidden) {
              return;
            }

            if (!option.compare || option.compare(filename, source)) {
              context.report({
                node: node,
                message: `Relative imports to "${option.source}" from "${it}" is forbidden`,
              });
            }
          })
        })
      },
    };
  },
};
