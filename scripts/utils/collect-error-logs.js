const collectErrorLogs = () => {
  const errors = [];

  const nativeError = console.error;

  console.error = (...args) => {
    errors.push(args);

    return nativeError(...args);
  };

  return () => {
    console.error = nativeError;

    if (errors.length > 0) {
      console.error(`\x1b[41m\x1b[1m ERRORS \x1b[0m`);

      errors.forEach((args) => {
        console.error(...args);
      });
    }
  };
};

export { collectErrorLogs };
