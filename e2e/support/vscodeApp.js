const { spawnSync } = require("node:child_process");
const { mkdtemp, mkdir, rm, utimes, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { dirname, join, resolve } = require("node:path");
const { _electron: electron } = require("@playwright/test");

const rootDir = resolve(__dirname, "..", "..");

async function launchMemoBoxAdminForE2E(options = {}) {
  const tempRoot = await mkdtemp(join(tmpdir(), "memobox-e2e-"));
  const workspaceDir = join(tempRoot, "workspace");
  const memoDir = join(workspaceDir, "memos");
  const metaDir = join(memoDir, ".vscode-memobox");
  const userDataDir = join(tempRoot, "user-data");
  const extensionsDir = join(tempRoot, "extensions");
  const withMemoDir = options.withMemoDir !== false;

  await mkdir(join(workspaceDir, ".vscode"), { recursive: true });
  if (withMemoDir) {
    await mkdir(join(memoDir, "2026", "03"), { recursive: true });
    await mkdir(join(metaDir, "templates"), { recursive: true });
    await mkdir(join(metaDir, "snippets"), { recursive: true });

    const olderMemoPath = join(memoDir, "2026", "03", "2026-03-21-plan.md");
    const newerMemoPath = join(memoDir, "2026", "03", "2026-03-22-review.md");
    await writeFile(olderMemoPath, "---\ntags: [project-x]\n---\n# Plan\n\n- item\n", "utf8");
    await writeFile(newerMemoPath, "---\ntitle: Review\ntags: [project-x, review]\n---\n# Review\n\n- done\n", "utf8");
    await utimes(olderMemoPath, new Date("2026-03-21T01:00:00Z"), new Date("2026-03-21T01:00:00Z"));
    await utimes(newerMemoPath, new Date("2026-03-22T01:00:00Z"), new Date("2026-03-22T01:00:00Z"));

    await writeFile(join(metaDir, "templates", "simple.md"), "# {{date}} {{title}}\n\n", "utf8");
    await writeFile(
      join(metaDir, "snippets", "markdown.json"),
      JSON.stringify(
        {
          note: {
            prefix: "memo-note",
            body: "## ${1:Title}",
            description: "Insert memo heading"
          }
        },
        null,
        2
      ),
      "utf8"
    );
  }

  await writeFile(
    join(workspaceDir, ".vscode", "settings.json"),
    JSON.stringify(
      {
        ...(withMemoDir ? { "memobox.memodir": memoDir } : {}),
        "memobox.recentCount": 2,
        "memobox.adminOpenOnStartup": withMemoDir,
        "memobox.locale": "en"
      },
      null,
      2
    ),
    "utf8"
  );

  const app = await electron.launch({
    executablePath: resolveCodeExecutablePath(),
    args: [
      workspaceDir,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${extensionsDir}`,
      `--extensionDevelopmentPath=${rootDir}`,
      "--skip-welcome",
      "--disable-workspace-trust",
      "--new-window"
    ]
  });

  const window = await app.firstWindow();

  return {
    app,
    window,
    workspaceDir,
    memoDir,
    async dispose() {
      await app.close();
      await rm(tempRoot, { force: true, recursive: true });
    }
  };
}

async function waitForWebviewFrame(window, testId, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const outerFrames = await window.locator("iframe").elementHandles();

    for (const outerFrameHandle of outerFrames) {
      const outerFrame = await outerFrameHandle.contentFrame();
      if (!outerFrame) {
        continue;
      }

      const innerFrameHandle = await outerFrame.locator("#active-frame").elementHandle();
      const innerFrame = innerFrameHandle ? await innerFrameHandle.contentFrame() : undefined;
      if (!innerFrame) {
        continue;
      }

      const rootCount = await innerFrame.locator(`[data-testid='${testId}']`).count().catch(() => 0);
      if (rootCount > 0) {
        return innerFrame;
      }
    }

    await window.waitForTimeout(500);
  }

  throw new Error(`Timed out waiting for MemoBox webview: ${testId}.`);
}

async function waitForAdminFrame(window, timeoutMs = 30_000) {
  return await waitForWebviewFrame(window, "admin-root", timeoutMs);
}

async function waitForSetupFrame(window, timeoutMs = 30_000) {
  return await waitForWebviewFrame(window, "setup-root", timeoutMs);
}

function resolveCodeExecutablePath() {
  if (process.env.CODE_EXECUTABLE && process.env.CODE_EXECUTABLE.trim() !== "") {
    return process.env.CODE_EXECUTABLE;
  }

  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, ["code"], { encoding: "utf8" });
  const codeCliPath = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line !== "");

  if (codeCliPath) {
    return process.platform === "win32"
      ? resolve(dirname(codeCliPath), "..", "Code.exe")
      : resolve(dirname(codeCliPath), "..", "Electron");
  }

  if (process.platform === "win32") {
    return "C:\\Users\\mail\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
  }

  throw new Error("Unable to resolve the local VS Code executable. Set CODE_EXECUTABLE to run Playwright E2E.");
}

module.exports = {
  launchMemoBoxAdminForE2E,
  waitForAdminFrame,
  waitForSetupFrame
};
