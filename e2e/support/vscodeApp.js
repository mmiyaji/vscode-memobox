const { spawnSync } = require("node:child_process");
const { mkdtemp, mkdir, rm, utimes, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { dirname, join, resolve } = require("node:path");
const { _electron: electron } = require("@playwright/test");

const rootDir = resolve(__dirname, "..", "..");

async function launchMemoBoxAdminForE2E(options = {}) {
  const tempRoot = await mkdtemp(join(tmpdir(), "memobox-e2e-"));
  const workspaceDir = join(tempRoot, "workspace");
  const memoDir = options.memoDirPath ?? join(workspaceDir, "memos");
  const configuredMemoDir = options.withMemoDir === false ? undefined : (options.memoDirSetting ?? memoDir);
  const seededMemoDir = configuredMemoDir ?? memoDir;
  const metaDir = join(seededMemoDir, ".vscode-memobox");
  const userDataDir = join(tempRoot, "user-data");
  const extensionsDir = join(tempRoot, "extensions");
  const withMemoDir = options.withMemoDir !== false;
  const shouldSeedMemoDir = options.seedMemoDir ?? withMemoDir;
  const memoFiles = options.memoFiles ?? [
    {
      relativePath: join("2026", "03", "2026-03-21-plan.md"),
      content: "---\ntags: [project-x]\n---\n# Plan\n\n- item\n",
      timestamp: "2026-03-21T01:00:00Z"
    },
    {
      relativePath: join("2026", "03", "2026-03-22-review.md"),
      content: "---\ntitle: Review\ntags: [project-x, review]\n---\n# Review\n\n- done\n- @todo: follow up\n",
      timestamp: "2026-03-22T01:00:00Z"
    }
  ];
  const templates = options.templates ?? {
    "simple.md": "# {{date}} {{title}}\n\n"
  };
  const snippets = options.snippets ?? {
    "markdown.json": JSON.stringify(
      {
        note: {
          prefix: "memo-note",
          body: "## ${1:Title}",
          description: "Insert memo heading"
        }
      },
      null,
      2
    )
  };

  await mkdir(join(workspaceDir, ".vscode"), { recursive: true });
  if (shouldSeedMemoDir) {
    await mkdir(join(seededMemoDir, "2026", "03"), { recursive: true });
    await mkdir(join(metaDir, "templates"), { recursive: true });
    await mkdir(join(metaDir, "snippets"), { recursive: true });

    for (const memoFile of memoFiles) {
      const memoPath = join(seededMemoDir, memoFile.relativePath);
      await mkdir(dirname(memoPath), { recursive: true });
      await writeFile(memoPath, memoFile.content, "utf8");
      if (memoFile.timestamp) {
        await utimes(memoPath, new Date(memoFile.timestamp), new Date(memoFile.timestamp));
      }
    }

    for (const [fileName, content] of Object.entries(templates)) {
      await writeFile(join(metaDir, "templates", fileName), content, "utf8");
    }

    for (const [fileName, content] of Object.entries(snippets)) {
      await writeFile(join(metaDir, "snippets", fileName), content, "utf8");
    }
  }

  await writeFile(
    join(workspaceDir, ".vscode", "settings.json"),
    JSON.stringify(
      {
        ...(configuredMemoDir ? { "memobox.memodir": configuredMemoDir } : {}),
        "memobox.recentCount": 2,
        "memobox.adminOpenOnStartup": options.adminOpenOnStartup ?? withMemoDir,
        "memobox.locale": "en"
        ,
        ...(options.settings ?? {})
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
    memoDir: seededMemoDir,
    configuredMemoDir,
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

async function waitForSetupStep(window, stepTestId, timeoutMs = 30_000) {
  return await waitForWebviewFrame(window, stepTestId, timeoutMs);
}

async function focusWorkbench(window) {
  await window.locator(".monaco-workbench").click({
    position: { x: 320, y: 120 }
  });
}

async function openSettingsUi(window) {
  await focusWorkbench(window);
  await window.keyboard.press("Control+,");
}

async function openCommandPalette(window) {
  await focusWorkbench(window);
  await window.keyboard.press("F1");
  const input = window.locator(".quick-input-widget input").last();
  await input.waitFor({ state: "visible", timeout: 30_000 });
  return input;
}

async function runCommand(window, commandTitle) {
  const input = await openCommandPalette(window);
  await input.fill(commandTitle);
  await window.waitForTimeout(400);
  await input.press("Enter");
}

async function waitForQuickInput(window) {
  const input = window.locator(".quick-input-widget input").last();
  await input.waitFor({ state: "visible", timeout: 30_000 });
  return input;
}

async function acceptQuickPick(window) {
  const input = await waitForQuickInput(window);
  await input.press("Enter");
}

async function fillQuickInput(window, value) {
  const input = await waitForQuickInput(window);
  await input.fill(value);
  return input;
}

async function pickQuickInputItem(window, text) {
  const item = window.locator(".quick-input-widget .monaco-list-row").filter({ hasText: text }).first();
  await item.waitFor({ state: "visible", timeout: 30_000 });
  await item.click();
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
  acceptQuickPick,
  fillQuickInput,
  launchMemoBoxAdminForE2E,
  openSettingsUi,
  openCommandPalette,
  pickQuickInputItem,
  runCommand,
  waitForAdminFrame,
  waitForQuickInput,
  waitForSetupFrame,
  waitForSetupStep
};
