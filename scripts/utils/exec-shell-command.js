import { exec } from "node:child_process";

const execShellCommand = (cmd, live, strict) => new Promise((resolve, reject) => {
  const child = exec(cmd, { maxBuffer: 1024 * 10_000 * 2 }, (error, stdout) => {
    if (strict && error) {
      reject({ stdout, error });
    }

    resolve({ stdout, error });
  })

  if (live) {
    child.stdout.on("data", (data) => {
      console.log(data.replace(/\n$/, ""));
    });
  }
});

export { execShellCommand };
