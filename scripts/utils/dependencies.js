const getMonoDependencyName = (dependency) => {
  const [base, name] = dependency.split("/");

  if (base.match(/~?@sb/)) {
    return name;
  }

  return null;
};

export { getMonoDependencyName };
