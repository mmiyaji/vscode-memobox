const { mkdir } = require("node:fs/promises");
const { join, resolve } = require("node:path");
const { test, expect } = require("@playwright/test");
const { launchMemoBoxAdminForE2E, runCommand, waitForAdminFrame, waitForSetupFrame } = require("./support/vscodeApp");

const screenshotOutputDir = resolve(__dirname, "..", "docs", "screenshots");

test.describe("README screenshot capture", () => {
  test.skip(process.env.MEMOBOX_WRITE_SCREENSHOTS !== "1", "Screenshots are generated only when explicitly requested.");

  test("Capture admin dashboard screenshot", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });

    const app = await launchMemoBoxAdminForE2E({
      adminOpenOnStartup: false,
      memoFiles: [
        {
          relativePath: join("2026", "03", "2026-03-21-sprint-plan.md"),
          content:
            "---\n" +
            "title: Sprint Plan\n" +
            "tags: [planning, project-x]\n" +
            "---\n\n" +
            "# Sprint Plan\n\n" +
            "- align milestones\n" +
            "- confirm scope\n",
          timestamp: "2026-03-21T02:00:00Z"
        },
        {
          relativePath: join("2026", "03", "2026-03-22-design-review.md"),
          content:
            "---\n" +
            "title: Design Review\n" +
            "tags: [review, ui]\n" +
            "---\n\n" +
            "# Design Review\n\n" +
            "- review screenshots\n" +
            "- @todo: sync copy updates\n",
          timestamp: "2026-03-22T05:30:00Z"
        },
        {
          relativePath: join("2026", "03", "2026-03-23-release-notes.md"),
          content:
            "---\n" +
            "title: Release Notes\n" +
            "tags: [release, project-x]\n" +
            "---\n\n" +
            "# Release Notes\n\n" +
            "- shipped incremental index updates\n" +
            "- polished admin dashboard\n",
          timestamp: "2026-03-23T01:00:00Z"
        }
      ],
      templates: {
        "simple.md": "---\ntitle: '{{titleYaml}}'\ntags:\n  - inbox\ndate: {{date}}\n---\n\n# {{date}} {{title}}\n\n",
        "meeting.md": "---\ntitle: '{{titleYaml}}'\ntags:\n  - meeting\ndate: {{date}}\n---\n\n# Meeting {{title}}\n\n- attendees:\n- notes:\n",
        "review.md": "---\ntitle: '{{titleYaml}}'\ntags:\n  - review\ndate: {{date}}\n---\n\n# Review {{title}}\n\n## Summary\n\n"
      },
      snippets: {
        "markdown.json": JSON.stringify(
          {
            section: {
              prefix: "memo-section",
              body: "## ${1:Section}",
              description: "Insert a memo section heading"
            }
          },
          null,
          2
        )
      }
    });

    try {
      await app.window.setViewportSize({ width: 1720, height: 980 });
      await app.window.keyboard.press("Control+Shift+E");
      await app.window.waitForTimeout(800);
      await expandExplorerNode(app.window, "memos");
      await app.window.waitForTimeout(250);
      await expandExplorerNode(app.window, "2026");
      await app.window.waitForTimeout(250);
      await expandExplorerNode(app.window, "03");
      await app.window.waitForTimeout(350);

      await runCommand(app.window, "View: Close Secondary Side Bar");
      await app.window.waitForTimeout(500);
      const auxiliaryCloseButton = app.window.locator(".part.auxiliarybar [aria-label='Close']").first();
      if (await auxiliaryCloseButton.isVisible().catch(() => false)) {
        await auxiliaryCloseButton.click();
        await app.window.waitForTimeout(300);
      }
      await app.window.keyboard.press("Control+Alt+Shift+M");

      const adminFrame = await waitForAdminFrame(app.window);
      await expect(adminFrame.locator("[data-testid='admin-title']")).toHaveText("Memo Overview");
      await adminFrame.locator("[data-testid='pin-file-button']").first().click();
      await app.window.waitForTimeout(500);

      const refreshedAdminFrame = await waitForAdminFrame(app.window);
      await refreshedAdminFrame.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await app.window.waitForTimeout(300);
      const yearNode = app.window.locator("text=2026").first();
      if (await yearNode.isVisible().catch(() => false)) {
        await yearNode.dblclick({ force: true });
        await app.window.waitForTimeout(250);
      }

      await app.window.screenshot({
        animations: "disabled",
        caret: "hide",
        clip: {
          x: 0,
          y: 0,
          width: 1450,
          height: 860
        },
        path: join(screenshotOutputDir, "admin-overview.png")
      });
    } finally {
      await app.dispose();
    }
  });

  test("Capture setup flow screenshot", async () => {
    await mkdir(screenshotOutputDir, { recursive: true });

    const app = await launchMemoBoxAdminForE2E({
      seedMemoDir: false
    });

    try {
      await app.window.setViewportSize({ width: 1440, height: 1080 });
      const setupFrame = await waitForSetupFrame(app.window);

      await expect(setupFrame.locator("[data-testid='setup-title']")).toHaveText("Setup MemoBox");
      await setupFrame.locator("[data-testid='setup-root']").screenshot({
        animations: "disabled",
        caret: "hide",
        path: join(screenshotOutputDir, "setup-flow.png")
      });
    } finally {
      await app.dispose();
    }
  });
});

async function expandExplorerNode(window, label) {
  await window.evaluate((nodeLabel) => {
    const rows = Array.from(document.querySelectorAll(".monaco-list-row"));
    const row = rows.find((candidate) => {
      const ariaLabel = candidate.getAttribute("aria-label") ?? "";
      const text = candidate.textContent ?? "";
      return ariaLabel.includes(nodeLabel) || text.includes(nodeLabel);
    });

    if (!row) {
      return;
    }

    row.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );

    const twistie = row.querySelector(".monaco-tl-twistie");
    if (!twistie) {
      return;
    }

    const className = twistie.className ?? "";
    if (!className.includes("collapsed")) {
      return;
    }

    twistie.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  }, label);
}
