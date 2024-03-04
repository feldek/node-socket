const getComposedCount = (count) => {
  let result = {
    disabled: 0,
    plain: 0,
  };

  if (typeof count === "object") {
    result = {
      ...result,
      ...count,
    };
  } else {
    result.plain = count;
  }

  return result;
}

export { getComposedCount };
