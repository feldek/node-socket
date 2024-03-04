import { readPackages } from "./utils/read-packages.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execShellCommand } from "./utils/exec-shell-command.js";

const PACKAGE_NAME_REGEXP = /^@sb\/(.+)/;

const shuffle = (list) => [...list].sort(() => 0.5 - Math.random());

const getRandomItem = (list) => shuffle(list)[0];

const checkLocalAndRemoteMasterDiff = async () => {
  await execShellCommand("git fetch origin master");

  const lastOriginMasterCommitSha = (await execShellCommand("git log origin/master --pretty=format:%h"))
    .stdout
    .split("\n")
    .at(0)

  const localBranchCommitsShaList = (await execShellCommand("git log --pretty=format:%h"))
    .stdout
    .split("\n")
    .slice(0, 100);

  const hasLastMaster = localBranchCommitsShaList.includes(lastOriginMasterCommitSha);

  if (!hasLastMaster) {
    console.error(`\x1b[31m\x1b[1m[ERROR] You branch is behind the remote master - Merge updated master in you local branch`)

    process.exit(1);
  }
}

const getEmailFromGitConfig = async () => {
  const std = await execShellCommand("git config --global --get user.email");

  const candidate = std.stdout.trim();

  if (!candidate) {
    console.error(`\x1b[31m\x1b[1m[ERROR] Email should be specified in git config - git config --global user.email "your.email@example.com"`)

    process.exit(1);
  }

  return candidate;
}

const extractPackageName = (nameWithPrefix) => {
  return PACKAGE_NAME_REGEXP.exec(nameWithPrefix)[1];
};

const main = async () => {
  await checkLocalAndRemoteMasterDiff();

  const gitEmail = await getEmailFromGitConfig();

  const rootJsMaintainers = JSON.parse(
    await readFile(
      resolve("./maintainers.json"), { encoding: "utf-8" },
    )
  );

  const paths = [];
  const packageToReviewersMap = {};
  const reviewersMap = {};

  await readPackages(
    (path) => paths.push(path),
  );

  for (const path of paths) {
    try {
      const mappedPath = resolve(path, "maintainers.json");

      const plainJson = await readFile(mappedPath, { encoding: "utf-8" });

      const parsedJson = JSON.parse(plainJson);

      const packageName = `@sb/${path.split('/').at(-1)}`;

      packageToReviewersMap[packageName] = {
        maintainers: parsedJson.maintainers,
        additionalReviewers: parsedJson.additionalReviewers,
      };
    } catch (error) {
    }
  }

  const diff = (await execShellCommand("git diff origin/master --name-only"))
    .stdout
    .split("\n")
    .map((diff) => diff.split("/").slice(0, -1).join("/"));

  const affectedPackages = diff.reduce(
    (acc, path) => {
      const fullPath = paths.find((originalPath) => {
        const match = /(javascript\/packages\/.+)/.exec(originalPath);

        if (!match) {
          return false;
        }

        return `${path}/`.includes(`${match[1].split("/").join("/")}/`);
      })

      if (fullPath) {
        acc.add(`@sb/${fullPath.split("/").at(-1)}`)
      }

      return acc;
    },
    new Set()
  )

  console.log(`\n\x1b[36m\x1b[1m - Reviewers per packages:\n`)

  // Try to find package maintainer
  for (const pkg of affectedPackages) {
    if (!packageToReviewersMap[pkg]) {
      continue;
    }

    const maintainers = shuffle(
      packageToReviewersMap[pkg].maintainers.filter(({ email }) => {
        return email.trim() !== gitEmail && !rootJsMaintainers.skipReviewersEmails[email];
      }),
    );

    const reviewer = getRandomItem(maintainers);

    if (reviewer) {
      reviewersMap[pkg] = reviewer;

      console.log(`\x1b[36m\x1b[1m${extractPackageName(pkg)}\x1b[0m: ${reviewer.name}`);

      continue;
    }

    const additionalReviewers = shuffle(
      packageToReviewersMap[pkg].additionalReviewers.filter(({ email }) => {
        return email.trim() !== gitEmail && !rootJsMaintainers.skipReviewersEmails[email];
      }),
    );

    const additionalReviewer = getRandomItem(additionalReviewers);

    reviewersMap[pkg] = additionalReviewer;

    console.log(`\x1b[36m\x1b[1m${extractPackageName(pkg)}\x1b[0m: ${additionalReviewer?.name ?? "UNKNOWN"}`);
  }

  console.log(`\n\x1b[36m\x1b[1m - Additional reviewers per packages:\n`);

  for (const pkg of affectedPackages) {
    if (!packageToReviewersMap[pkg]) {
      continue;
    }

    const additionalReviewers = shuffle([...packageToReviewersMap[pkg].maintainers, ...packageToReviewersMap[pkg].additionalReviewers]
      .filter(({ email }) => email.trim() !== gitEmail
        && reviewersMap[pkg]?.email !== email
        && !rootJsMaintainers.skipReviewersEmails[email]
      )
      .map(({ name }) => name)
    );

    if (additionalReviewers.length) {
      console.log(`\x1b[36m\x1b[1m${extractPackageName(pkg)}\x1b[0m: ${additionalReviewers.join(", ")}`);
    }
  }

  console.log(`\n\x1b[36m\x1b[1m - Fallback JS reviewers (ℹ️ Pick only if mainainers or additional reviewers unavailable):\n`)

  const jsMaintainers = shuffle(
    rootJsMaintainers.maintainers
      .filter(({ email, name }) => {
        return email.trim() !== gitEmail && !Object.values(reviewersMap).includes(name) && !rootJsMaintainers.skipReviewersEmails[email];
      })
      .map(({ name }) => name),
  )

  console.log(`\x1b[36m\x1b[1m ${jsMaintainers.join(", ")}\n`)
}

main()
  .then()
  .catch((error) => console.log(error));
