const { createServer } = require("node:http");
const { access, copyFile, mkdir, mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, expect } = require("@playwright/test");
const {
  acceptQuickPick,
  fillQuickInput,
  launchMemoBoxAdminForE2E,
  openCommandPalette,
  pickQuickInputItem,
  runCommand,
  waitForAdminFrame,
  waitForQuickInput,
  waitForSetupFrame,
  waitForSetupStep
} = require("./support/vscodeApp");

const screenshotOutputDir = resolve(__dirname, "..", "docs", "screenshots");

test.describe("README workflow GIF capture", () => {
  test.skip(process.env.MEMOBOX_WRITE_DEMO_GIF !== "1", "GIFs are generated only when explicitly requested.");

  test("Capture quick memo workflow GIF", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });
    const frameDir = await mkdtemp(join(tmpdir(), "memobox-quickmemo-"));
    const app = await launchMemoBoxAdminForE2E({
      adminOpenOnStartup: false,
      memoFiles: [
        {
          relativePath: join("2026", "03", "2026-03-24.md"),
          content:
            "---\n" +
            "title: '2026-03-24'\n" +
            "tags:\n" +
            "  - inbox\n" +
            "date: 2026-03-24\n" +
            "---\n\n" +
            "# 2026-03-24\n\n" +
            "## 09:00\n\n" +
            "- Inbox review\n",
          timestamp: "2026-03-24T00:00:00Z"
        }
      ]
    });

    let frameIndex = 1;

    try {
      await app.window.setViewportSize({ width: 1680, height: 980 });
      await runCommand(app.window, "MemoBox: Today's Quick Memo");
      const input = await waitForQuickInput(app.window);
      await input.fill("Sync release checklist");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await input.press("Enter");
      await app.window.waitForTimeout(1400);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 3);

      await buildGif(frameDir, join(screenshotOutputDir, "quick-memo.gif"));
      await expectFile(join(screenshotOutputDir, "quick-memo.gif"));
    } finally {
      await app.dispose();
      await rm(frameDir, { recursive: true, force: true });
    }
  });

  test("Capture grep workflow GIF", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });
    const frameDir = await mkdtemp(join(tmpdir(), "memobox-grep-"));
    const app = await launchMemoBoxAdminForE2E({
      adminOpenOnStartup: false,
      memoFiles: [
        {
          relativePath: join("2026", "03", "2026-03-21-plan.md"),
          content:
            "---\n" +
            "title: 'Sprint Plan'\n" +
            "tags:\n" +
            "  - planning\n" +
            "date: 2026-03-21\n" +
            "---\n\n" +
            "# Sprint Plan\n\n" +
            "- Review backlog\n",
          timestamp: "2026-03-21T01:00:00Z"
        },
        {
          relativePath: join("2026", "03", "2026-03-22-review.md"),
          content:
            "---\n" +
            "title: 'Design Review'\n" +
            "tags:\n" +
            "  - review\n" +
            "date: 2026-03-22\n" +
            "---\n\n" +
            "# Design Review\n\n" +
            "- Review memo structure\n" +
            "- @todo: review screenshots\n",
          timestamp: "2026-03-22T04:00:00Z"
        }
      ]
    });

    let frameIndex = 1;

    try {
      await app.window.setViewportSize({ width: 1680, height: 980 });
      await runCommand(app.window, "MemoBox: Grep");
      await acceptQuickPick(app.window);
      const input = await waitForQuickInput(app.window);
      await input.fill("review");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await input.press("Enter");
      await app.window.waitForTimeout(900);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await app.window.keyboard.press("Enter");
      await app.window.waitForTimeout(1200);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 3);

      await buildGif(frameDir, join(screenshotOutputDir, "grep-workflow.gif"));
      await expectFile(join(screenshotOutputDir, "grep-workflow.gif"));
    } finally {
      await app.dispose();
      await rm(frameDir, { recursive: true, force: true });
    }
  });

  test("Capture setup workflow GIF", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });
    const frameDir = await mkdtemp(join(tmpdir(), "memobox-setup-"));
    const app = await launchMemoBoxAdminForE2E({
      seedMemoDir: false
    });

    let frameIndex = 1;

    try {
      await app.window.setViewportSize({ width: 1500, height: 980 });
      const setupFrame = await waitForSetupFrame(app.window);
      await expect(setupFrame.locator("[data-testid='setup-title']")).toHaveText("Setup MemoBox");
      frameIndex = await captureWebviewFrame(app, setupFrame, frameDir, frameIndex, 2);

      await setupFrame.locator("[data-testid='setup-use-suggested-folder']").click();
      const workspaceFrame = await waitForSetupStep(app.window, "setup-step-workspace");
      frameIndex = await captureWebviewFrame(app, workspaceFrame, frameDir, frameIndex, 2);

      await workspaceFrame.locator("[data-testid='setup-create-workspace']").click();
      const doneFrame = await waitForSetupStep(app.window, "setup-step-done");
      frameIndex = await captureWebviewFrame(app, doneFrame, frameDir, frameIndex, 3);

      await buildGif(frameDir, join(screenshotOutputDir, "setup-workflow.gif"));
      await expectFile(join(screenshotOutputDir, "setup-workflow.gif"));
    } finally {
      await app.dispose();
      await rm(frameDir, { recursive: true, force: true });
    }
  });

  test("Capture AI title workflow GIF", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });
    const frameDir = await mkdtemp(join(tmpdir(), "memobox-ai-title-"));
    const mockServer = await startMockAiServer([
      "Scaffold Review Notes",
      "Weekly Memo Status",
      "Release Prep Summary"
    ], 11434);
    const app = await launchMemoBoxAdminForE2E({
      adminOpenOnStartup: true,
      memoFiles: [
        {
          relativePath: join("2026", "03", "2026-03-24-ai-demo.md"),
          content:
            "---\n" +
            "title: 'Draft note'\n" +
            "tags:\n" +
            "  - inbox\n" +
            "date: 2026-03-24\n" +
            "---\n\n" +
            "# Draft note\n\n" +
            "## Focus\n\n" +
            "- Review scaffold updates\n" +
            "- Prepare release checklist\n",
          timestamp: "2026-03-24T06:00:00Z"
        }
      ],
      settings: {
        "memobox.aiEnabled": true
      }
    });

    let frameIndex = 1;

    try {
      await app.window.setViewportSize({ width: 1680, height: 980 });
      await waitForAdminFrame(app.window);
      await app.window.waitForTimeout(600);
      await app.window.keyboard.press("Control+P");
      const fileQuickOpen = await waitForQuickInput(app.window);
      await fileQuickOpen.fill("2026-03-24-ai-demo.md");
      await app.window.waitForTimeout(500);
      await fileQuickOpen.press("Enter");
      await app.window.waitForTimeout(1200);
      await app.window.keyboard.press("Escape");
      await app.window.locator(".quick-input-widget").waitFor({ state: "hidden", timeout: 10_000 });
      await app.window.locator(".view-lines").first().click({ position: { x: 120, y: 80 } });
      await app.window.waitForTimeout(300);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);

      const paletteInput = await openCommandPalette(app.window);
      await expect(paletteInput).toHaveAttribute("placeholder", /Type the name of a command to run/i, {
        timeout: 10_000
      });
      await paletteInput.fill(">MemoBox: Commands");
      await app.window.waitForTimeout(500);
      await pickQuickInputItem(app.window, "MemoBox: Commands");
      await app.window.waitForTimeout(500);
      const launcherInput = await waitForQuickInput(app.window);
      await expect(launcherInput).toHaveAttribute("placeholder", /Run a MemoBox command/i, {
        timeout: 10_000
      });
      await launcherInput.fill("AI Generate Title");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await launcherInput.press("Enter");

      const quickInput = await waitForQuickInput(app.window);
      await expect(quickInput).toHaveAttribute("placeholder", /Select a generated title/i, {
        timeout: 30_000
      });
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);

      await app.window.keyboard.press("ArrowDown");
      await app.window.waitForTimeout(300);
      await app.window.keyboard.press("Enter");
      await app.window.waitForTimeout(1200);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 3);

      await buildGif(frameDir, join(screenshotOutputDir, "ai-title-workflow.gif"));
      await expectFile(join(screenshotOutputDir, "ai-title-workflow.gif"));
    } finally {
      await app.dispose();
      await mockServer.dispose();
      await rm(frameDir, { recursive: true, force: true });
    }
  });
});

async function captureFrame(window, frameDir, startIndex, repeat = 1) {
  const framePath = join(frameDir, `frame-${String(startIndex).padStart(4, "0")}.png`);
  await window.screenshot({
    animations: "disabled",
    caret: "hide",
    clip: {
      x: 0,
      y: 0,
      width: 1450,
      height: 860
    },
    path: framePath
  });

  for (let copyIndex = 1; copyIndex < repeat; copyIndex += 1) {
    const duplicatePath = join(frameDir, `frame-${String(startIndex + copyIndex).padStart(4, "0")}.png`);
    await copyFile(framePath, duplicatePath);
  }

  return startIndex + repeat;
}

async function captureWebviewFrame(app, frame, frameDir, startIndex, repeat = 1) {
  const framePath = join(frameDir, `frame-${String(startIndex).padStart(4, "0")}.png`);
  const box = await frame.locator("body").boundingBox();
  if (!box) {
    throw new Error("Unable to resolve webview bounding box for README GIF capture.");
  }

  await app.window.screenshot({
    animations: "disabled",
    caret: "hide",
    clip: {
      x: Math.max(0, Math.floor(box.x) - 8),
      y: Math.max(0, Math.floor(box.y) - 8),
      width: Math.ceil(box.width) + 16,
      height: Math.ceil(box.height) + 16
    },
    path: framePath
  });

  for (let copyIndex = 1; copyIndex < repeat; copyIndex += 1) {
    const duplicatePath = join(frameDir, `frame-${String(startIndex + copyIndex).padStart(4, "0")}.png`);
    await copyFile(framePath, duplicatePath);
  }

  return startIndex + repeat;
}

async function buildGif(frameDir, outputPath) {
  const palettePath = join(frameDir, "palette.png");
  const framePattern = join(frameDir, "frame-%04d.png");

  const paletteResult = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "1",
      "-i",
      framePattern,
      "-vf",
      "fps=8,scale=1280:-1:flags=lanczos,palettegen",
      "-frames:v",
      "1",
      "-update",
      "1",
      palettePath
    ],
    { stdio: "inherit" }
  );

  if (paletteResult.status !== 0) {
    throw new Error("Failed to generate GIF palette.");
  }

  const gifResult = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "1",
      "-i",
      framePattern,
      "-i",
      palettePath,
      "-lavfi",
      "fps=8,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse",
      outputPath
    ],
    { stdio: "inherit" }
  );

  if (gifResult.status !== 0) {
    throw new Error("Failed to generate workflow GIF.");
  }
}

async function expectFile(filePath) {
  await access(filePath);
}

async function startMockAiServer(titles, port) {
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/api/chat") {
      response.statusCode = 404;
      response.end("not found");
      return;
    }

    for await (const _chunk of request) {
      // Consume the request body so the socket can close cleanly.
    }

    await new Promise((resolve) => setTimeout(resolve, 450));
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        message: {
          content: JSON.stringify(titles)
        }
      })
    );
  });

  await new Promise((resolve) => {
    server.listen(port, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start the mock AI server.");
  }

  return {
    endpoint: `http://127.0.0.1:${address.port}`,
    async dispose() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}
