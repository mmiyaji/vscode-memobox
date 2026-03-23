import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  MEMOBOX_WRITE_SCREENSHOTS: "1"
};

const buildResult = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const captureResult = spawnSync("npx", ["playwright", "test", "e2e/readme-screenshots.e2e.js"], {
  stdio: "inherit",
  shell: true,
  env
});

process.exit(captureResult.status ?? 1);
