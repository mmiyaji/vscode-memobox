const { access, copyFile, mkdir, mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, expect } = require("@playwright/test");
const {
  launchMemoBoxAdminForE2E,
  openCommandPalette
} = require("./support/vscodeApp");

const screenshotOutputDir = resolve(__dirname, "..", "docs", "screenshots");

test.describe("README demo GIF capture", () => {
  test.skip(process.env.MEMOBOX_WRITE_DEMO_GIF !== "1", "GIF is generated only when explicitly requested.");

  test("Capture memo workflow demo GIF", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });
    const frameDir = await mkdtemp(join(tmpdir(), "memobox-gif-frames-"));

    const app = await launchMemoBoxAdminForE2E({
      adminOpenOnStartup: false,
      memoFiles: [
        {
          relativePath: join("2026", "03", "2026-03-22-design-review.md"),
          content:
            "---\n" +
            "title: 'Design Review'\n" +
            "tags:\n" +
            "  - review\n" +
            "  - ui\n" +
            "date: 2026-03-22\n" +
            "---\n\n" +
            "# 2026-03-22 Design Review\n\n" +
            "## Findings\n\n" +
            "- Adjust heading spacing\n" +
            "- @todo: sync copy updates\n",
          timestamp: "2026-03-22T05:30:00Z"
        },
        {
          relativePath: join("2026", "03", "2026-03-23-release-notes.md"),
          content:
            "---\n" +
            "title: 'Release Notes'\n" +
            "tags:\n" +
            "  - release\n" +
            "  - project-x\n" +
            "date: 2026-03-23\n" +
            "---\n\n" +
            "# 2026-03-23 Release Notes\n\n" +
            "## Highlights\n\n" +
            "- Incremental index updates shipped\n",
          timestamp: "2026-03-23T01:00:00Z"
        }
      ],
      templates: {
        "simple.md":
          "---\n" +
          "title: '{{titleYaml}}'\n" +
          "tags:\n" +
          "  - inbox\n" +
          "date: {{date}}\n" +
          "---\n\n" +
          "# {{date}} {{title}}\n\n",
        "meeting.md":
          "---\n" +
          "title: '{{titleYaml}}'\n" +
          "tags:\n" +
          "  - meeting\n" +
          "date: {{date}}\n" +
          "---\n\n" +
          "# Meeting {{title}}\n\n- attendees:\n- notes:\n"
      },
      snippets: {
        "markdown.json": JSON.stringify(
          {
            section: {
              prefix: "memo-section",
              body: ["## ${1:Section}", "", "- ${2:note}"],
              description: "Insert a memo section heading"
            }
          },
          null,
          2
        )
      }
    });

    let frameIndex = 1;

    try {
      await app.window.setViewportSize({ width: 1680, height: 980 });
      await app.window.keyboard.press("Control+Shift+E");
      await app.window.waitForTimeout(700);

      const paletteInput = await openCommandPalette(app.window);
      await paletteInput.fill("MemoBox");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await app.window.keyboard.press("Escape");
      await app.window.waitForTimeout(300);
      await app.window.keyboard.press("Control+Alt+N");

      const titleInput = await waitForQuickInputPlaceholder(app.window, "Enter a memo title");
      await titleInput.fill("Roadmap Notes");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await titleInput.press("Enter");

      await waitForQuickInputPlaceholder(app.window, "Select a template");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await app.window.keyboard.press("Enter");
      await app.window.waitForTimeout(1200);

      await jumpToLine(app.window, "4");
      await app.window.keyboard.press("End");
      await app.window.keyboard.press("Enter");
      await app.window.keyboard.type("  - roadmap");
      await app.window.waitForTimeout(500);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);

      await app.window.keyboard.press("Control+End");
      await app.window.keyboard.type("\n\nmemo-section");
      await app.window.waitForTimeout(400);
      await app.window.keyboard.press("Control+Space");
      await app.window.waitForTimeout(700);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await app.window.keyboard.press("Enter");
      await app.window.waitForTimeout(700);

      await app.window.keyboard.type("\nSee also [[design revi");
      await app.window.waitForTimeout(400);
      await app.window.keyboard.press("Control+Space");
      await app.window.waitForTimeout(700);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 2);
      await app.window.keyboard.press("Enter");
      await app.window.waitForTimeout(700);
      frameIndex = await captureFrame(app.window, frameDir, frameIndex, 3);

      await buildGif(frameDir, join(screenshotOutputDir, "memo-workflow.gif"));
      await expectFile(join(screenshotOutputDir, "memo-workflow.gif"));
    } finally {
      await app.dispose();
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

async function jumpToLine(window, lineNumber) {
  await window.keyboard.press("Control+G");
  const input = window.locator(".quick-input-widget input").last();
  await input.waitFor({ state: "visible", timeout: 30_000 });
  await input.fill(lineNumber);
  await input.press("Enter");
  await window.waitForTimeout(250);
}

async function waitForQuickInputPlaceholder(window, placeholderText) {
  const input = window.locator(".quick-input-widget input").last();
  await expect(input).toHaveAttribute("placeholder", new RegExp(escapeRegExp(placeholderText), "i"), {
    timeout: 30_000
  });
  return input;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
