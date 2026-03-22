const { test, expect } = require("@playwright/test");
const { launchMemoBoxAdminForE2E, waitForAdminFrame, waitForSetupFrame } = require("./support/vscodeApp");

test("Admin renders memo state and supports pin/unpin from recent files", async () => {
  const app = await launchMemoBoxAdminForE2E();

  try {
    const adminFrame = await waitForAdminFrame(app.window);

    await expect(adminFrame.locator("[data-testid='admin-title']")).toHaveText("Memo Overview");
    await expect(adminFrame.locator("[data-testid='indexed-files-value']")).toHaveText("2");
    await expect(adminFrame.locator("[data-testid='templates-panel'] [data-testid='template-name']").first()).toHaveText(
      "simple.md"
    );
    await expect(adminFrame.locator("[data-testid='snippets-panel'] [data-testid='snippet-name']").first()).toHaveText(
      "markdown.json"
    );
    await expect(adminFrame.locator("[data-testid='tags-panel']")).toContainText("project-x");

    const recentPanel = adminFrame.locator("[data-testid='recent-files-panel']");
    await expect(recentPanel.locator("[data-testid='memo-item-path']").first()).toHaveText("2026/03/2026-03-22-review.md");

    await recentPanel.locator("[data-testid='pin-file-button']").first().click();
    await app.window.waitForTimeout(500);

    const pinnedFrame = await waitForAdminFrame(app.window);
    const pinnedPanel = pinnedFrame.locator("[data-testid='pinned-files-panel']");
    await expect(pinnedPanel.locator("[data-testid='memo-item-path']").first()).toHaveText("2026/03/2026-03-22-review.md");

    await pinnedPanel.locator("[data-testid='unpin-file-button']").first().click();
    await app.window.waitForTimeout(500);

    const unpinnedFrame = await waitForAdminFrame(app.window);
    const unpinnedPanel = unpinnedFrame.locator("[data-testid='pinned-files-panel']");
    await expect(unpinnedPanel.locator("[data-testid='memo-list-empty']")).toBeVisible();
  } finally {
    await app.dispose();
  }
});

test("Setup opens on first run when memodir is missing", async () => {
  const app = await launchMemoBoxAdminForE2E({ withMemoDir: false });

  try {
    const setupFrame = await waitForSetupFrame(app.window);

    await expect(setupFrame.locator("[data-testid='setup-title']")).toHaveText("Setup MemoBox");
    await expect(setupFrame.locator("[data-testid='setup-root']")).toContainText("Choose Memo Root");
    await expect(setupFrame.locator("[data-testid='setup-root']")).toContainText("Documents");
  } finally {
    await app.dispose();
  }
});
