import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  MEMOBOX_WRITE_DEMO_GIF: "1"
};

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npm", ["run", "build"]);
run("npx", ["playwright", "test", "e2e/readme-demo.e2e.js", "e2e/readme-workflows.e2e.js"]);
