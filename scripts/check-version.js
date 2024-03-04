import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const all = fs.readdirSync(path.resolve(__dirname, '..', 'packages'))
  .map(file => {
    try {
      return fs.readFileSync(path.resolve(__dirname, '..', 'packages', file, 'package.json'), "utf-8")
    } catch (e) {
      return undefined;
    }
  })
  .filter(Boolean)
  .map(JSON.parse)
  .reduce((acc, packageJson) => {
    acc[packageJson.name] = {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      optionalDependencies: packageJson.optionalDependencies || {},
      peerDependencies: packageJson.peerDependencies || {},
    }

    return acc
  }, {});

const putToTree = (target, version, lib, packageName, type) => {
  if (!target[lib]) {
    target[lib] = {
      [version]: []
    };
  }

  if (!target[lib][version]) {
    target[lib][version] = [];
  }

  target[lib][version].push({packageName, type})
}

const mergeDeps = (target, packageName, type, deps) => {
  Object.entries(deps).forEach(([lib, version]) => {
    putToTree(target, version, lib, packageName, type)
  })
};

const result = {};

Object.entries(all).forEach(([packageName, allDeps]) => {
  ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].forEach(type => {
    if (allDeps[type]) {
      mergeDeps(result, packageName, type, allDeps[type])
    }
  })
});

const createHash = (line) => line.join("--")

const ignore = [
  ['@babylonjs/core', '5.44.0', '@sb/graphics-core', 'dependencies'],
  ['@babylonjs/core', '5.55.0', '@sb/widget-v2', 'dependencies'],
].reduce((acc, line) => {
  acc[createHash(line)] = true;

  return acc
}, {});

const withMultiVersion = Object.entries(result)
  .filter(([_, versions]) => Object.keys(versions).length > 1)
  .reduce((acc, [name, versions]) => {
    acc[name] = versions;

    return acc;
  }, {});

const shouldIgnore = (description) => !!ignore[createHash(description)]

const removeIgnored = (tree) => {
  const result = {};

  Object.entries(tree).forEach(([libName, versions]) => {
    Object.entries(versions).forEach(([version, packages]) => {
      packages.forEach(pkg => {
        if (!shouldIgnore([libName, version, pkg.packageName, pkg.type])) {
          putToTree(result, version, libName, pkg.packageName, pkg.type)
        }
      })
    })
  });

  return result;
}

const printLogs = (tree) => {
  Object.entries(tree).forEach(([packageName, versions]) => {
    console.error(`'${packageName}':`);
    Object.entries(versions).forEach(([version, packages]) => {
      console.log(` - [${version}] used in: ${packages.map(it => it.packageName).join(", ")}`)
    })
  });
};

const allInstalledPackages = Object
  .keys(
    Object.values(all).reduce((acc, lib) => {
      return {
        ...acc,
        ...lib.dependencies,
        ...lib.devDependencies
      }
    }, {})
  )
  .filter(it => !/^@sb/.test(it) && !/^@types/.test(it))
  .sort();

function compareVersion(a, b) {
  if (a === b) {
    return 0;
  }

  const aComponents = a.split(".");
  const bComponents = b.split(".");

  const len = Math.min(aComponents.length, bComponents.length);

  // loop while the components are equal
  for (let i = 0; i < len; i++) {
    // A bigger than B
    if (parseInt(aComponents[i]) > parseInt(bComponents[i])) {
      return 1;
    }

    // B bigger than A
    if (parseInt(aComponents[i]) < parseInt(bComponents[i])) {
      return -1;
    }
  }

  // If one's a prefix of the other, the longer one is greater.
  if (aComponents.length > bComponents.length) {
    return 1;
  }

  if (aComponents.length < bComponents.length) {
    return -1;
  }

  // Otherwise they are the same.
  return 0;
}


const update = (scanResult) => {

  const packageJsonPerPackage = {};

  const pathToPackageJson = (packageName) => {
    const dirName = packageName.replace("@sb/", "");

    return path.resolve(__dirname, `../packages/${dirName}/package.json`);
  }

  const getPackageJson = (packageName) => {
    if (!packageJsonPerPackage[packageName]) {
      packageJsonPerPackage[packageName] = JSON.parse(
        fs.readFileSync(pathToPackageJson(packageName), "utf-8")
      );
    }

    return packageJsonPerPackage[packageName];
  }

  Object.entries(scanResult).forEach(([depsName, versions]) => {
    const latest = Object.keys(versions).sort(compareVersion).reverse()[0];

    Object.entries(versions).forEach(([version, usedBy]) => {
      if (version === latest) {
        return;
      }

      usedBy.forEach(_package => {
        const packageJson = getPackageJson(_package.packageName);

        // mutate
        packageJson[_package.type][depsName] = latest;
      })
    });
  });

  Object.entries(packageJsonPerPackage).forEach(([packageName, packageJson]) => {
    fs.writeFileSync(pathToPackageJson(packageName), JSON.stringify(packageJson, undefined, 2))
  });

  console.log(packageJsonPerPackage);
}

const withoutIgnores = removeIgnored(withMultiVersion);

const shouldUpdate = process.argv[2] === "--update";

process.argv

if (Object.keys(withoutIgnores).length > 0) {

  console.error("\nFound different versions of dependencies :\n");

  printLogs(withoutIgnores);

  if (shouldUpdate) {
    console.info("Run update.");

    update(withoutIgnores);

    process.exit(0);
  }

  console.error("\nUse yarn up package-name@X.X.X ..., for update version in javascript context.");

  process.exit(1);
}
