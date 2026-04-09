const { execSync } = require("child_process");
const { spawnSync } = require("child_process");

const stagedFiles = execSync(
  "git diff --cached --name-only --diff-filter=ACM",
  {
    encoding: "utf-8",
  },
)
  .split("\n")
  .filter(Boolean);

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--user",
    `${process.getuid()}:${process.getgid()}`,
    "--volume",
    `${process.cwd()}:/usr/src/app`,
    "lirantal/detect-secrets",
    "--baseline",
    ".secrets.baseline",
    ...stagedFiles,
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
