export default (results) => {
  let output = []

  let total = 0;
  let resultI = 0;
  let maxRuleLength = 0;

  const stats = new Map();

  while (resultI < results.length) {
    const result = results[resultI];
    resultI++;

    if (result.warnings.length === 0) {
      continue;
    }

    const warnings = result.warnings;

    total += warnings.length;

    let warningI = 0;

    while (warningI < warnings.length) {
      const warning = warnings[warningI];
      warningI++

      const rule = warning.rule;

      if (rule.length > maxRuleLength) {
        maxRuleLength = rule.length;
      }

      stats.set(rule, (stats.get(rule) ?? 0) + 1);

      let text = `${result.source}:`;
      text += `${warning.line || 0}:`;
      text += `${warning.column || 0}:`;
      text += ` \x1b[31m[${rule}]\x1b[0m`;
      text += ` ${warning.text.replaceAll("\n", " ")}\n`;

      output.push(text);
    }
  }

  output.sort((a, b) => {
    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  });

  output = output.join("");

  output += "\n⏣ Stats ⏣\n";

  if (stats.size > 0) {
    output += "\n";

    Array.from(stats.entries())
      .sort(([a], [b]) => {
        if (a < b) {
          return -1;
        }

        if (a > b) {
          return 1
        }

        return 0;
      })
      .forEach(([key, value]) => {
        output += `${key.padEnd(maxRuleLength + 4, " ")}${value}\n`
      });
  }

  output += `\n⏣ ${total} Problems ⏣`;

  // We need to force emit formatter output to stdout, stylelint in this version doesn't do this.
  console.log(output)

  return output;
};
