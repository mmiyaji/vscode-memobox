const { access, readFile, readdir, writeFile } = require("node:fs/promises");
const { join } = require("node:path");
const { test, expect } = require("@playwright/test");
const {
  acceptQuickPick,
  fillQuickInput,
  launchMemoBoxAdminForE2E,
  openCommandPalette,
  runCommand,
  openSettingsUi,
  pickQuickInputItem,
  waitForAdminFrame,
  waitForQuickInput,
  waitForSetupFrame,
  waitForSetupStep
} = require("./support/vscodeApp");

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

    await unpinnedFrame
      .locator("[data-testid='admin-open-on-startup-setting'] input[value='false']")
      .check({ force: true });
    await app.window.waitForTimeout(500);

    const refreshedFrame = await waitForAdminFrame(app.window);
    await expect(
      refreshedFrame.locator("[data-testid='admin-open-on-startup-setting'] input[value='false']")
    ).toBeChecked();
  } finally {
    await app.dispose();
  }
});

async function runAlignCsvInEditor(app, csvPath, inputLines) {
  await writeFile(csvPath, inputLines.join("\n"), "utf8");

  const explorerFile = app.window
    .locator(".explorer-folders-view .monaco-list-row")
    .filter({ hasText: "table.md" })
    .first();
  await explorerFile.waitFor({ state: "visible", timeout: 30_000 });
  await explorerFile.dblclick();
  await app.window.waitForTimeout(1_200);

  const editorLines = app.window.locator(".view-lines").first();
  await editorLines.click({ position: { x: 80, y: 60 } });
  await app.window.keyboard.press("Control+A");
  await editorLines.click({ button: "right", position: { x: 120, y: 40 } });
  await app.window.locator(".monaco-menu .action-menu-item").filter({ hasText: "MemoBox" }).first().click();
  const alignMenuItem = app.window
    .locator(".monaco-menu .action-menu-item")
    .filter({ hasText: "Align Selected CSV Columns" })
    .first();
  await alignMenuItem.waitFor({ state: "visible", timeout: 30_000 });
  await alignMenuItem.hover();
  await app.window.keyboard.press("Enter");
  await app.window.waitForTimeout(1_200);
  await app.window.keyboard.press("Control+S");
  await app.window.waitForTimeout(900);

  return await readFile(csvPath, "utf8");
}

test("Align Selected CSV Columns rewrites the selected text in the editor", async () => {
  const app = await launchMemoBoxAdminForE2E({
    adminOpenOnStartup: false
  });

  try {
    const csvPath = join(app.workspaceDir, "table.md");
    const longMultibyteValue = "\u3042".repeat(10) + "305";
    const updated = await runAlignCsvInEditor(app, csvPath, [
      "id,name,status,owner",
      "1,alpha,open,mmiyaji",
      "22,beta,closed,satokaz",
      `${longMultibyteValue},gamma,in review,team-a`
    ]);

    expect(updated).toBe(
      [
        "id,                      name,  status,    owner",
        "1,                       alpha, open,      mmiyaji",
        "22,                      beta,  closed,    satokaz",
        `${longMultibyteValue}, gamma, in review, team-a`
      ].join("\n")
    );
  } finally {
    await app.dispose();
  }
});

test("Align CSV handles long CJK text in the middle column", async () => {
  const app = await launchMemoBoxAdminForE2E({
    adminOpenOnStartup: false
  });

  try {
    const csvPath = join(app.workspaceDir, "table.md");
    const updated = await runAlignCsvInEditor(app, csvPath, [
      "\u3042id,name,status,owner",
      "1,alpha,op\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042en,mmiyaji",
      "22,beta,\u3046\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304Aclosed,satokaz",
      "\u3042\u3042\u3042\u3042\u304230,gamma,in review,team-a"
    ]);

    expect(updated).toBe(
      [
        "\u3042id,         name,  status,                                     owner",
        "1,            alpha, op\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042\u3042en, mmiyaji",
        "22,           beta,  \u3046\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304A\u304Aclosed,               satokaz",
        "\u3042\u3042\u3042\u3042\u304230, gamma, in review,                                  team-a"
      ].join("\n")
    );
  } finally {
    await app.dispose();
  }
});

test("Align CSV handles long CJK text in the first column", async () => {
  const app = await launchMemoBoxAdminForE2E({
    adminOpenOnStartup: false
  });

  try {
    const csvPath = join(app.workspaceDir, "table.md");
    const updated = await runAlignCsvInEditor(app, csvPath, [
      "\u3042id,name,status,owner",
      "1,alpha,open,mmiyaji",
      "22,beta,closed,satokaz",
      "\u3042\u3042\u3042\u3042\u3042305,gamma,in review,team-a"
    ]);

    expect(updated).toBe(
      [
        "\u3042id,          name,  status,    owner",
        "1,             alpha, open,      mmiyaji",
        "22,            beta,  closed,    satokaz",
        "\u3042\u3042\u3042\u3042\u3042305, gamma, in review, team-a"
      ].join("\n")
    );
  } finally {
    await app.dispose();
  }
});

test("Setup can create the configured memo root and workspace file", async () => {
  const app = await launchMemoBoxAdminForE2E({
    seedMemoDir: false
  });

  try {
    const setupFrame = await waitForSetupFrame(app.window);

    await expect(setupFrame.locator("[data-testid='setup-title']")).toHaveText("Setup MemoBox");
    await expect(setupFrame.locator("[data-testid='setup-root-heading']")).toHaveText("Finish Memo Root Setup");

    await setupFrame.locator("[data-testid='setup-use-suggested-folder']").click();

    const workspaceFrame = await waitForSetupStep(app.window, "setup-step-workspace");
    await expect(workspaceFrame.locator("[data-testid='setup-workspace-heading']")).toHaveText("Create Workspace File");

    await workspaceFrame.locator("[data-testid='setup-create-workspace']").click();

    const doneFrame = await waitForSetupStep(app.window, "setup-step-done");
    await expect(doneFrame.locator("[data-testid='setup-done-heading']")).toHaveText("Ready To Start");

    const workspaceFilePath = join(app.memoDir, "MemoBox.code-workspace");
    await access(workspaceFilePath);
  } finally {
    await app.dispose();
  }
});

test("New Memo can select a template and create the expected file", async () => {
  const app = await launchMemoBoxAdminForE2E({
    templates: {
      "simple.md": "# {{date}} {{title}}\n\n",
      "meeting.md": "# Meeting {{title}}\n\n- attendees:\n- notes:\n"
    }
  });

  try {
    const adminFrame = await waitForAdminFrame(app.window);
    await adminFrame.locator("[data-command='memobox.newMemo']").click();

    const titleInput = await waitForQuickInput(app.window);
    await titleInput.fill("Weekly Sync");
    await titleInput.press("Enter");

    await pickQuickInputItem(app.window, "meeting");

    const todayDirectory = join(app.memoDir, getCurrentYearLabel(), getCurrentMonthLabel());
    const createdMemoName = (await readdir(todayDirectory)).find((name) => name.includes("Weekly-Sync"));
    expect(createdMemoName).toBeTruthy();

    const createdMemoPath = join(todayDirectory, createdMemoName);
    const createdMemo = await readFile(createdMemoPath, "utf8");
    expect(createdMemo).toContain("# Meeting Weekly Sync");
    expect(createdMemo).toContain("- attendees:");
  } finally {
    await app.dispose();
  }
});

test("Grep and Todo commands surface searchable results through quick pick", async () => {
  const app = await launchMemoBoxAdminForE2E();

  try {
    const adminFrame = await waitForAdminFrame(app.window);
    await adminFrame.locator("[data-command='memobox.grepMemos']").click();
    await acceptQuickPick(app.window);

    const grepInput = await fillQuickInput(app.window, "Review");
    await grepInput.press("Enter");

    const grepWidget = app.window.locator(".quick-input-widget");
    await expect(grepWidget).toContainText("2026-03-22-review.md");

    await app.window.keyboard.press("Enter");
    await app.window.keyboard.press("Control+Alt+Shift+M");

    const refreshedAdminFrame = await waitForAdminFrame(app.window);
    const todoButton = refreshedAdminFrame.locator("[data-command='memobox.todoMemos']");
    await expect(todoButton).toBeVisible();
    await todoButton.click({ force: true });
    await acceptQuickPick(app.window);

    const todoWidget = app.window.locator(".quick-input-widget");
    await expect(todoWidget).toContainText("@todo: follow up");
  } finally {
    await app.dispose();
  }
});

test("Settings UI shows grouped MemoBox sections", async () => {
  const app = await launchMemoBoxAdminForE2E({
    adminOpenOnStartup: false
  });

  try {
    await openSettingsUi(app.window);
    await app.window.waitForTimeout(1_000);
    await app.window.keyboard.type("@ext:mmiyaji.vscode-memobox");
    await app.window.waitForTimeout(1_000);

    await expect(app.window.locator("text=Core Paths").first()).toBeVisible();
    await expect(app.window.locator("text=Templates & Metadata").first()).toBeVisible();
    await expect(app.window.locator("text=Creation & Quick Memo").first()).toBeVisible();
    await expect(app.window.locator("text=Browsing & Opening").first()).toBeVisible();
    await expect(app.window.locator("text=Search & Discovery").first()).toBeVisible();
    await expect(app.window.locator("text=Admin & Localization").first()).toBeVisible();
  } finally {
    await app.dispose();
  }
});

test("AI commands stay hidden when disabled and appear when enabled", async () => {
  const disabledApp = await launchMemoBoxAdminForE2E();

  try {
    const disabledAdmin = await waitForAdminFrame(disabledApp.window);
    await expect(disabledAdmin.locator("text=AI").first()).toBeVisible();
    await expect(disabledAdmin.locator("text=Off").first()).toBeVisible();

    const disabledPalette = await openCommandPalette(disabledApp.window);
    await disabledPalette.fill("MemoBox: AI Generate Title");
    await expect(disabledApp.window.locator(".quick-input-widget")).toContainText("No matching results");

    await disabledPalette.fill("MemoBox: AI Set API Key");
    await expect(disabledApp.window.locator(".quick-input-widget")).toContainText("No matching results");
  } finally {
    await disabledApp.dispose();
  }

  const enabledApp = await launchMemoBoxAdminForE2E({
    settings: {
      "memobox.aiEnabled": true
    }
  });

  try {
    const enabledAdmin = await waitForAdminFrame(enabledApp.window);
    await expect(enabledAdmin.locator("text=Configured").first()).toBeVisible();
    await expect(enabledAdmin.locator("text=API key: Not required").first()).toBeVisible();

    const enabledPalette = await openCommandPalette(enabledApp.window);
    await enabledPalette.fill("MemoBox: AI Generate Title");
    await expect(enabledApp.window.locator(".quick-input-widget .monaco-list-row")).toHaveCount(1);

    await enabledPalette.fill("MemoBox: AI Set API Key");
    await expect(enabledApp.window.locator(".quick-input-widget .monaco-list-row")).toHaveCount(1);
  } finally {
    await enabledApp.dispose();
  }
});

function getCurrentYearLabel() {
  return String(new Date().getFullYear());
}

function getCurrentMonthLabel() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}
