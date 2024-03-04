module.exports = (results) => {
  const outputs = {
    warnings: "",
    errors: "",
  };

  let hasError = false;
  let total = 0;
  let resultI = 0;
  let maxRuleLength = 0;

  const stats = new Map();

  while (resultI < results.length) {
    const result = results[resultI];
    resultI++;

    const messages = result.messages;

    total += messages.length;

    let messageI = 0;

    while (messageI < messages.length) {
      const message = messages[messageI];
      messageI++

      const isError = message.fatal || message.severity === 2;

      if (isError) {
        hasError = true;
      }

      const type = isError ? "errors" : "warnings";

      if (hasError && type === "warnings") {
        continue;
      }

      const rule = message.ruleId ? `${message.ruleId}` : "unknown";

      if (rule.length > maxRuleLength) {
        maxRuleLength = rule.length;
      }

      stats.set(rule, (stats.get(rule) ?? 0) + 1);

      let text = `${result.filePath}:`;
      text += `${message.line || 0}:`;
      text += `${message.column || 0}:`;
      text += ` \x1b[3${isError ? 1 : 3}m[${rule}]\x1b[0m`;
      text += ` ${message.message.replaceAll("\n", " ")}\n`;

      outputs[type] += text;
    }
  }

  let output = hasError
    ? outputs.errors
    : outputs.warnings;

  if (!hasError) {
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
  }

  output += `\n⏣ ${total} Problems ⏣`;

  return output;
};
