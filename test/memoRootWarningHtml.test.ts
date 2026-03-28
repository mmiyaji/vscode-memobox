import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomPageVariables, renderAdminHtml } from "../src/features/admin/adminHtml";
import type { AdminDashboardModel } from "../src/features/admin/adminViewModel";
import { renderSetupHtml } from "../src/features/setup/setupHtml";
import type { SetupViewModel } from "../src/features/setup/setupViewModel";
import type { MemoBoxUiText } from "../src/shared/uiText";
import { applyTemplateVariables, extractTemplateKeys } from "../src/shared/webviewTemplate";
import { resolveRequiredGroups } from "../src/features/pages/customPageDataGroups";

test("applyTemplateVariables does not double-expand values containing template patterns", () => {
  const result = applyTemplateVariables("Hello {{GREETING}}, version {{VERSION}}", {
    GREETING: "Welcome to {{VERSION}}",
    VERSION: "1.0.0"
  });

  assert.equal(result, "Hello Welcome to {{VERSION}}, version 1.0.0");
});

test("applyTemplateVariables leaves unknown variables intact", () => {
  const result = applyTemplateVariables("{{KNOWN}} and {{UNKNOWN}}", {
    KNOWN: "resolved"
  });

  assert.equal(result, "resolved and {{UNKNOWN}}");
});

test("applyTemplateVariables expands each loops", () => {
  const result = applyTemplateVariables(
    "<ul>{{#each ITEMS}}<li>{{.name}} ({{.count}})</li>{{/each}}</ul>",
    {},
    { ITEMS: [{ name: "alpha", count: 3 }, { name: "beta", count: 7 }] }
  );

  assert.equal(result, "<ul><li>alpha (3)</li><li>beta (7)</li></ul>");
});

test("applyTemplateVariables escapes loop item values", () => {
  const result = applyTemplateVariables(
    "{{#each ROWS}}<td>{{.label}}</td>{{/each}}",
    {},
    { ROWS: [{ label: "<script>alert(1)</script>" }] }
  );

  assert.equal(result, "<td>&lt;script&gt;alert(1)&lt;/script&gt;</td>");
});

test("applyTemplateVariables provides _index, _first, _last in loops", () => {
  const result = applyTemplateVariables(
    "{{#each ITEMS}}[{{._index}}:{{._first}}:{{._last}}]{{/each}}",
    {},
    { ITEMS: [{ x: "a" }, { x: "b" }, { x: "c" }] }
  );

  assert.equal(result, "[0:true:][1::][2::true]");
});

test("applyTemplateVariables renders empty string for unknown loop key", () => {
  const result = applyTemplateVariables(
    "before{{#each MISSING}}<li>{{.x}}</li>{{/each}}after",
    {},
    { OTHER: [{ x: "y" }] }
  );

  assert.equal(result, "beforeafter");
});

test("applyTemplateVariables combines loops and variables", () => {
  const result = applyTemplateVariables(
    "<h1>{{TITLE}}</h1>{{#each TAGS}}<span>{{.tag}}</span>{{/each}}",
    { TITLE: "My Tags" },
    { TAGS: [{ tag: "rust" }, { tag: "ts" }] }
  );

  assert.equal(result, "<h1>My Tags</h1><span>rust</span><span>ts</span>");
});

test("renderSetupHtml shows localized broad-root reasons", () => {
  const model: SetupViewModel = {
    version: "0.1.0",
    memoRoot: "C:/Users/mail/Documents",
    memoRootConfigured: true,
    memoRootReady: true,
    suggestedMemoRoot: "C:/Users/mail/Documents/MemoBox",
    recommendedMemoRoot: "C:/Users/mail/Documents/MemoBox",
    setupTargetPath: "C:/Users/mail/Documents",
    metaDir: ".vscode-memobox",
    workspaceFilePath: "C:/Users/mail/Documents/MemoBox.code-workspace",
    workspaceFileExists: false,
    memoRootLooksBroad: true,
    memoRootRiskCodes: ["documents"]
  };

  const html = renderSetupHtml(model, "nonce", "memoRoot", createEnglishUiText(), "en");

  assert.match(html, /Reasons: Documents/);
  assert.match(html, /Recommended: C:\/Users\/mail\/Documents\/MemoBox/);
});

test("renderAdminHtml shows localized broad-root reasons", () => {
  const model: AdminDashboardModel = {
    version: "0.1.0",
    generatedAtLabel: "2026-03-23 10:00",
    memoRoot: "C:/Users/mail/Documents",
    memoRootReady: true,
    memoRootLooksBroad: true,
    memoRootRiskCodes: ["documents", "home"],
    recommendedMemoRoot: "C:/Users/mail/Documents/MemoBox",
    workspaceFilePath: "C:/Users/mail/Documents/MemoBox.code-workspace",
    workspaceFileExists: false,
    datePathFormat: "yyyy/MM",
    metaDir: ".vscode-memobox",
    locale: "en",
    adminOpenOnStartup: true,
    excludeDirectories: ["node_modules"],
    maxScanDepth: 4,
    todayDirectory: "C:/Users/mail/Documents/2026/03",
    todayMemoPath: "C:/Users/mail/Documents/2026/03/2026-03-23.md",
    templatePath: "C:/Users/mail/Documents/.vscode-memobox/templates/simple.md",
    hasExplicitTemplateOverride: false,
    templatesDirectory: "C:/Users/mail/Documents/.vscode-memobox/templates",
    templatesDirectoryReady: true,
    snippetsDirectory: "C:/Users/mail/Documents/.vscode-memobox/snippets",
    snippetsDirectoryReady: true,
    templates: [],
    snippets: [],
    aiEnabled: false,
    aiCostMode: "off",
    aiPerRequestLimitUsd: 0,
    aiMonthlyLimitUsd: 0,
    aiConfigured: false,
    aiProfileName: "",
    aiProvider: "",
    aiModel: "",
    aiEndpoint: "",
    aiApiKeySource: "none",
    aiIssueSummary: "",
    aiMonthlyEstimatedCostUsd: 0,
    aiMonthlyRequestCount: 0,
    totalFiles: 0,
    latestUpdatedAtLabel: "n/a",
    indexFilePath: "C:/Users/mail/Documents/.vscode-memobox/index.json",
    indexFileExists: true,
    indexFileSizeLabel: "1.0 KB",
    indexLoadSource: "primary",
    indexBackupExists: true,
    indexTransientBackupExists: false,
    pinnedFiles: [],
    recentFiles: [],
    folderCounts: [],
    topTags: [],
    totalTagCount: 0,
    hiddenTagCount: 0,
    customPages: []
  };

  const html = renderAdminHtml(model, "nonce", createEnglishUiText());

  assert.match(html, /Reasons: Documents, Home/);
  assert.match(html, /Recommended: C:\/Users\/mail\/Documents\/MemoBox/);
});

test("renderAdminHtml shows custom page links", () => {
  const model: AdminDashboardModel = {
    version: "0.1.0",
    generatedAtLabel: "2026-03-23 10:00",
    memoRoot: "C:/Users/mail/Documents",
    memoRootReady: true,
    memoRootLooksBroad: false,
    memoRootRiskCodes: [],
    recommendedMemoRoot: "",
    workspaceFilePath: "C:/Users/mail/Documents/MemoBox.code-workspace",
    workspaceFileExists: false,
    datePathFormat: "yyyy/MM",
    metaDir: ".vscode-memobox",
    locale: "en",
    adminOpenOnStartup: true,
    excludeDirectories: [],
    maxScanDepth: 4,
    todayDirectory: "C:/memo/2026/03",
    todayMemoPath: "C:/memo/2026/03/2026-03-23.md",
    templatePath: "C:/memo/.vscode-memobox/templates/simple.md",
    hasExplicitTemplateOverride: false,
    templatesDirectory: "C:/memo/.vscode-memobox/templates",
    templatesDirectoryReady: true,
    snippetsDirectory: "C:/memo/.vscode-memobox/snippets",
    snippetsDirectoryReady: true,
    templates: [],
    snippets: [],
    aiEnabled: false,
    aiCostMode: "off",
    aiPerRequestLimitUsd: 0,
    aiMonthlyLimitUsd: 0,
    aiConfigured: false,
    aiProfileName: "",
    aiProvider: "",
    aiModel: "",
    aiEndpoint: "",
    aiApiKeySource: "none",
    aiIssueSummary: "",
    aiMonthlyEstimatedCostUsd: 0,
    aiMonthlyRequestCount: 0,
    totalFiles: 42,
    latestUpdatedAtLabel: "2026-03-23",
    indexFilePath: "index.json",
    indexFileExists: true,
    indexFileSizeLabel: "1 KB",
    indexLoadSource: "primary",
    indexBackupExists: false,
    indexTransientBackupExists: false,
    pinnedFiles: [],
    recentFiles: [],
    folderCounts: [],
    topTags: [],
    totalTagCount: 0,
    hiddenTagCount: 0,
    customPages: [
      {
        id: "my_page",
        title: "My Custom Page",
        htmlBody: "<h2>Hello</h2>",
        absolutePath: "C:/test/my_page.html"
      }
    ]
  };

  const html = renderAdminHtml(model, "nonce", createEnglishUiText());

  // Custom page link should appear
  assert.match(html, /data-open-custom-page="C:\/test\/my_page\.html"/);
  assert.match(html, /My Custom Page/);

  // No tab-based elements
  assert.doesNotMatch(html, /data-tab-id/);
  assert.doesNotMatch(html, /tab-bar/);
});

test("buildCustomPageVariables expands model values for custom pages", () => {
  const model: AdminDashboardModel = {
    version: "2.0.0",
    generatedAtLabel: "2026-03-25 12:00",
    memoRoot: "C:/memo",
    memoRootReady: true,
    memoRootLooksBroad: false,
    memoRootRiskCodes: [],
    recommendedMemoRoot: "",
    workspaceFilePath: "test.code-workspace",
    workspaceFileExists: false,
    datePathFormat: "yyyy/MM",
    metaDir: ".vscode-memobox",
    locale: "en",
    adminOpenOnStartup: true,
    excludeDirectories: [],
    maxScanDepth: 4,
    todayDirectory: "C:/memo/2026/03",
    todayMemoPath: "C:/memo/2026/03/2026-03-25.md",
    templatePath: "C:/memo/.vscode-memobox/templates/simple.md",
    hasExplicitTemplateOverride: false,
    templatesDirectory: "C:/memo/.vscode-memobox/templates",
    templatesDirectoryReady: true,
    snippetsDirectory: "C:/memo/.vscode-memobox/snippets",
    snippetsDirectoryReady: true,
    templates: [],
    snippets: [],
    aiEnabled: false,
    aiCostMode: "off",
    aiPerRequestLimitUsd: 0,
    aiMonthlyLimitUsd: 0,
    aiConfigured: false,
    aiProfileName: "",
    aiProvider: "",
    aiModel: "",
    aiEndpoint: "",
    aiApiKeySource: "none",
    aiIssueSummary: "",
    aiMonthlyEstimatedCostUsd: 0,
    aiMonthlyRequestCount: 0,
    totalFiles: 100,
    latestUpdatedAtLabel: "2026-03-25",
    indexFilePath: "index.json",
    indexFileExists: true,
    indexFileSizeLabel: "5 KB",
    indexLoadSource: "primary",
    indexBackupExists: false,
    indexTransientBackupExists: false,
    pinnedFiles: [],
    recentFiles: [],
    folderCounts: [],
    topTags: [],
    totalTagCount: 0,
    hiddenTagCount: 0,
    customPages: []
  };

  const vars = buildCustomPageVariables(model);

  assert.equal(vars.VERSION, "2.0.0");
  assert.equal(vars.MEMO_ROOT, "C:/memo");
  assert.equal(vars.TOTAL_FILES, "100");
  assert.equal(vars.LOCALE, "en");
  assert.equal(vars.DATE_PATH_FORMAT, "yyyy/MM");
  assert.equal(vars.META_DIR, ".vscode-memobox");
});

test("extractTemplateKeys returns variables and loops from template", () => {
  const usage = extractTemplateKeys(
    "<h1>{{VERSION}}</h1>{{#each RECENT_FILES}}<li>{{.relativePath}}</li>{{/each}}<p>{{MEMO_ROOT}}</p>"
  );

  assert.deepEqual([...usage.variables].sort(), ["MEMO_ROOT", "VERSION"]);
  assert.deepEqual([...usage.loops], ["RECENT_FILES"]);
});

test("extractTemplateKeys returns empty sets for plain HTML", () => {
  const usage = extractTemplateKeys("<h1>Hello World</h1>");

  assert.equal(usage.variables.size, 0);
  assert.equal(usage.loops.size, 0);
});

test("resolveRequiredGroups returns empty set for settings-only variables", () => {
  const usage = extractTemplateKeys("{{VERSION}} {{MEMO_ROOT}} {{LOCALE}}");
  const groups = resolveRequiredGroups(usage);

  assert.equal(groups.size, 0);
});

test("resolveRequiredGroups includes index for TOTAL_FILES", () => {
  const usage = extractTemplateKeys("{{TOTAL_FILES}}");
  const groups = resolveRequiredGroups(usage);

  assert.equal(groups.has("index"), true);
  assert.equal(groups.has("templates"), false);
});

test("resolveRequiredGroups includes index and pinned for RECENT_FILES loop", () => {
  const usage = extractTemplateKeys("{{#each RECENT_FILES}}<li>{{.relativePath}}</li>{{/each}}");
  const groups = resolveRequiredGroups(usage);

  assert.equal(groups.has("index"), true);
  assert.equal(groups.has("pinned"), true);
  assert.equal(groups.has("templates"), false);
  assert.equal(groups.has("snippets"), false);
});

test("resolveRequiredGroups includes templates for TEMPLATES loop", () => {
  const usage = extractTemplateKeys("{{#each TEMPLATES}}<li>{{.name}}</li>{{/each}}");
  const groups = resolveRequiredGroups(usage);

  assert.equal(groups.has("templates"), true);
  assert.equal(groups.has("index"), false);
});

test("resolveRequiredGroups includes pinned implies index", () => {
  const usage = extractTemplateKeys("{{#each PINNED_FILES}}<li>{{.relativePath}}</li>{{/each}}");
  const groups = resolveRequiredGroups(usage);

  assert.equal(groups.has("pinned"), true);
  assert.equal(groups.has("index"), true);
});

function createEnglishUiText(): MemoBoxUiText {
  return {
    formatMemoRootRisk: (riskCode) => {
      switch (riskCode) {
        case "filesystemRoot":
          return "Drive root";
        case "home":
          return "Home";
        case "documents":
          return "Documents";
        case "desktop":
          return "Desktop";
        case "downloads":
          return "Downloads";
        default:
          return riskCode;
      }
    },
    pages: {
      commandTitle: "MemoBox: Open Custom Page",
      noPagesFound: "No custom pages found.",
      pickerPlaceholder: "Select a custom page to open",
      panelSectionTitle: "Custom Pages",
      pageCount: (count) => `${count} pages`,
      blockedCommand: "Blocked command",
      blockedPath: "Blocked path"
    },
    admin: {
      pageTitle: "MemoBox",
      panelTitle: (version) => `MemoBox ${version}`,
      overviewTitle: "Memo Overview",
      overviewCopy: "Overview",
      lastRefreshedLabel: "Last refreshed",
      dataSourceLabel: "Data source",
      scopeLabel: "Scope",
      noIndexedFiles: "No memo files are indexed yet.",
      noPinnedFiles: "No pinned files.",
      actionGroupDaily: "Daily",
      actionGroupMaintenance: "Maintenance",
      actionNewMemo: "New Memo",
      actionQuickMemo: "Quick Memo",
      actionListMemos: "List/Edit",
      actionTags: "Tags",
      actionGrep: "Grep",
      actionTodo: "Todo",
      actionOpenFolder: "Open Folder",
      actionRefreshIndex: "Refresh Index",
      actionRebuildIndex: "Rebuild Index",
      actionClearIndexCache: "Clear Index Cache",
      actionShowLogs: "Show Logs",
      actionShowAiLogs: "Show AI Logs",
      actionCreateWorkspace: "Create Workspace",
      actionOpenSetup: "Open Setup",
      actionSetAiApiKey: "Set AI API Key",
      actionClearAiApiKey: "Clear Stored AI API Key",
      actionReloadAdmin: "Reload Admin",
      actionSettings: "Settings",
      warningTitle: "Memo root is not ready",
      warningCopy: "Repair the memo root configuration.",
      warningBroadRootTitle: "Memo root may be too broad",
      warningBroadRootCopy: "Use a dedicated child folder.",
      warningBroadRootReasons: (reasons) => `Reasons: ${reasons}`,
      warningBroadRootRecommendation: (path) => `Recommended: ${path}`,
      warningUseRecommendedPath: "Use Recommended Path",
      warningOpenSetup: "Open Setup",
      summaryMemoRoot: "Memo Root",
      summaryMemoRootReady: "Ready",
      summaryMemoRootNeedsSetup: "Needs setup",
      summaryIndexedMemos: "Indexed Memos",
      summaryLatestUpdate: (value) => `Latest update: ${value}`,
      summaryMemoIndex: "Memo Index",
      summaryAvailable: "Available",
      summaryNotCreated: "Not created",
      summaryMaintenance: "Maintenance",
      summaryHealthy: "Healthy",
      summaryIssues: (count) => `${count} issues`,
      summaryAi: "AI",
      summaryAiOff: "Off",
      summaryAiConfigured: "Configured",
      summaryAiNeedsSetup: "Needs setup",
      summaryAiDisabledDetail: "Disabled in settings.",
      summaryAiNeedsSetupDetail: "AI configuration needs attention.",
      summaryAiKey: (label) => `API key: ${label}`,
      summaryAiKeySettings: "Settings JSON",
      summaryAiKeySecretStorage: "SecretStorage",
      summaryAiKeyEnvironment: "Environment",
      summaryAiKeyMissing: "Missing",
      summaryAiKeyNotRequired: "Not required",
      recentMemosTitle: "Recent Memos",
      recentMemosSubtitle: "Recent files.",
      recentMemosMeta: "Recent meta.",
      pinnedMemosTitle: "Pinned Memos",
      pinnedMemosSubtitle: "Pinned files.",
      folderSummaryTitle: "Folder Summary",
      folderSummarySubtitle: "Folder subtitle.",
      folderSummaryMeta: "Folder meta.",
      folderSummaryEmpty: "No folders.",
      tagsTitle: "Tags",
      tagsSubtitle: "Tags subtitle.",
      tagsMeta: "Tags meta.",
      tagsEmpty: "No tags.",
      browseAllTags: "Browse All Tags",
      showTagMemos: (tag) => `Show memos tagged with #${tag}`,
      workspaceStatusTitle: "Workspace Status",
      workspaceStatusSubtitle: "Workspace subtitle.",
      kvMemoRoot: "Memo Root",
      kvTodayDirectory: "Today Directory",
      kvTodayMemoPath: "Today Memo Path",
      kvDefaultTemplate: "Default Template",
      kvWorkspaceFile: "Workspace File",
      kvAdminOpenOnStartup: "Open Admin On Startup",
      kvConfiguration: "Configuration",
      optionEnabled: "Enabled",
      optionDisabled: "Disabled",
      maintenanceAssetsTitle: "Maintenance Assets",
      maintenanceAssetsSubtitle: "Maintenance subtitle.",
      templatesTitle: "Templates",
      templatesSubtitle: "Template subtitle.",
      snippetsTitle: "Snippets",
      snippetsSubtitle: "Snippet subtitle.",
      labelDirectory: "Directory",
      ensureDirs: "Ensure Dirs",
      reveal: "Reveal",
      templatesDirectoryReady: "Ready",
      templatesDirectoryMissing: "Missing",
      snippetsDirectoryReady: "Ready",
      snippetsDirectoryMissing: "Missing",
      templatesDirectoryNotReady: "Templates directory is not ready yet.",
      snippetsDirectoryNotReady: "Snippets directory is not ready yet.",
      noTemplateFiles: "No template files found.",
      noSnippetFiles: "No snippet files found.",
      clearExplicitDefault: "Clear Explicit Default",
      open: "Open",
      setDefault: "Set Default",
      defaultTemplate: "Default template",
      availableTemplate: "Available template",
      noSnippetEntries: "No snippet entries found.",
      failedToLoad: (message) => `Failed to load: ${message}`,
      maintenanceTemplatesReady: "Templates ready",
      maintenanceTemplatesMissing: "Templates directory missing",
      maintenanceSnippetsReady: "Snippets ready",
      maintenanceSnippetsMissing: "Snippets directory missing",
      maintenanceSnippetLoadErrors: "Snippet load errors detected",
      created: "Created",
      notCreated: "Not created",
      notAvailable: "n/a",
      pin: "Pin",
      unpin: "Unpin",
      files: (count) => `${count} files`,
      memos: (count) => `${count} memos`,
      templateFiles: (count) => `${count} template files`,
      snippetFiles: (count) => `${count} snippet files`,
      snippets: (count) => `${count} snippets`,
      errorFileUnavailable: "Unavailable",
      errorRevealFailed: "Reveal failed",
      errorSetMemoDirBeforeScaffold: "Set memodir first."
    },
    setup: {
      pageTitle: "MemoBox Setup",
      panelTitle: (version) => `MemoBox Setup ${version}`,
      title: "Setup MemoBox",
      heroCopy: "Setup copy.",
      stepMemoRoot: "1. Memo Root",
      stepWorkspace: "2. Workspace",
      stepReady: "3. Ready",
      memoRootHeadingChoose: "Choose Memo Root",
      memoRootHeadingFinish: "Finish Memo Root Setup",
      memoRootCopyChoose: "Choose a memo root.",
      memoRootCopyFinish: "Finish setup.",
      useSuggestedFolder: "Use Suggested Folder",
      createThisFolder: "Create This Folder",
      chooseFolder: "Choose Folder",
      openSettings: "Open Settings",
      broadRootWarningTitle: "This path looks broader than a typical memo root",
      broadRootWarningCopy: "Prefer a dedicated child folder.",
      broadRootReasons: (reasons) => `Reasons: ${reasons}`,
      broadRootRecommendation: (path) => `Recommended: ${path}`,
      useRecommendedPath: "Use Recommended Path",
      broadRootConfirmTitle: "The selected memo root looks too broad.",
      broadRootConfirmDetail: (path) => `The selected path is ${path}.`,
      broadRootConfirmAction: "Use Anyway",
      suggestedPath: "Suggested Path",
      configuredPath: "Configured Path",
      storedAs: "Stored As",
      storedAsGlobal: "Global setting: memobox.memodir",
      createdFolders: "Created Folders",
      workspaceHeading: "Create Workspace File",
      workspaceCopy: "Workspace copy.",
      createWorkspaceFile: "Create Workspace File",
      openMemoFolder: "Open Memo Folder",
      skipForNow: "Skip For Now",
      workspaceFile: "Workspace File",
      includedSettings: "Included Settings",
      recommendations: "Recommendations",
      readyHeading: "Ready To Start",
      readyCopy: "Ready copy.",
      createFirstMemo: "Create First Memo",
      openAdmin: "Open Admin",
      openWorkspace: "Open Workspace",
      readyMemoRoot: "Memo Root",
      readyNext: "Next",
      readyNextCopy: "Next copy.",
      notCreated: "Not created",
      memoRootReadyMessage: (path) => `Memo root is ready at ${path}.`,
      workspaceOpenFailed: "Failed to open workspace."
    }
  };
}
