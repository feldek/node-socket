import {getChangedPackages} from "./get-changed-packages.js"
import {readPackages} from "./read-packages.js";

const PACKAGE_NAMES = process.env.PACKAGE_NAMES.split(",");

// e2e
const IGNORE = [
  /^backup($|\/)/,
  /^docs($|\/)/,
  /^etc($|\/)/,
  /^flutter($|\/)/,
  /([.\/])Dockerfile$/,
  /\.md$/,
];

const FORCE_CHANGES = [
  /^etc\/ci\/trigger_all.md$/,
  /^kotlin($|\/)/,
  /^etc\/services\/sftp_read_internal\/Dockerfile$/,
  /^etc\/services\/sftp_read_external\/Dockerfile$/,
  /^javascript\/(?!packages\/)(?!.*\/\.)((?!Dockerfile).)*$/,
  /^docker-compose.yml$/,
];

const perform = async () => {
  const packages = await readPackages();

  PACKAGE_NAMES.forEach(packageName => {
    if (!packages.hasOwnProperty(packageName)) {
      throw new Error(`Unknown package name "${packageName}"`)
    }
  })

  const changedPackages = await getChangedPackages(IGNORE, FORCE_CHANGES);

  if (PACKAGE_NAMES.some(packageName => changedPackages.has(packageName))) {
    process.exit(2);
  }

  process.exit(0);
};

perform()
  .catch((e) => {
    console.error(e);

    process.exit(1);
  });
