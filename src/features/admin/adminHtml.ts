import { applyTemplateVariables, loadWebviewTemplate } from "../../shared/webviewTemplate";
import type { MemoBoxUiText } from "../../shared/uiText";
import type { MemoRootRiskCode } from "../../core/memo/memoRootGuard";
import type {
  AdminCountRow,
  AdminDashboardModel,
  AdminMemoFile,
  AdminSnippetAsset,
  AdminTemplateAsset
} from "./adminViewModel";

export function renderAdminHtml(model: AdminDashboardModel, nonce: string, ui: MemoBoxUiText): string {
  const template = loadWebviewTemplate("admin.html");
  const css = loadWebviewTemplate("admin.css");
  const text = ui.admin;

  return applyTemplateVariables(template, {
    NONCE: nonce,
    CSS: css,
    PAGE_TITLE: escapeHtml(text.pageTitle),
    VERSION: escapeHtml(model.version),
    OVERVIEW_TITLE: escapeHtml(text.overviewTitle),
    OVERVIEW_COPY: escapeHtml(text.overviewCopy),
    LAST_REFRESHED_LABEL: escapeHtml(text.lastRefreshedLabel),
    DATA_SOURCE_LABEL: escapeHtml(text.dataSourceLabel),
    SCOPE_LABEL: escapeHtml(text.scopeLabel),
    GENERATED_AT: escapeHtml(model.generatedAtLabel),
    INDEX_SOURCE: escapeHtml(model.indexFilePath || text.notAvailable),
    MEMO_SCOPE: escapeHtml(model.memoRoot || "memobox.memodir is not set"),
    WARNING_BANNER: renderWarningBanner(model, ui),
    SUMMARY_CARDS: renderSummaryCards(model, ui),
    ACTION_BUTTONS: renderActionButtons(model, ui),
    RECENT_MEMOS_TITLE: escapeHtml(text.recentMemosTitle),
    RECENT_MEMOS_SUBTITLE: escapeHtml(text.recentMemosSubtitle),
    RECENT_MEMOS_META: escapeHtml(text.recentMemosMeta),
    PINNED_MEMOS_TITLE: escapeHtml(text.pinnedMemosTitle),
    PINNED_MEMOS_SUBTITLE: escapeHtml(text.pinnedMemosSubtitle),
    FOLDER_SUMMARY_TITLE: escapeHtml(text.folderSummaryTitle),
    FOLDER_SUMMARY_SUBTITLE: escapeHtml(text.folderSummarySubtitle),
    FOLDER_SUMMARY_META: escapeHtml(text.folderSummaryMeta),
    TAGS_TITLE: escapeHtml(text.tagsTitle),
    TAGS_SUBTITLE: escapeHtml(text.tagsSubtitle),
    TAGS_META: escapeHtml(text.tagsMeta),
    RECENT_MEMOS: renderMemoItems(model.recentFiles, text.noIndexedFiles, ui),
    PINNED_MEMOS: renderMemoItems(model.pinnedFiles, text.noPinnedFiles, ui),
    FOLDER_ROWS: renderFolderRows(model.folderCounts, model.totalFiles, ui),
    TAG_ROWS: renderTagRows(model, ui),
    AI_USAGE_PANEL: renderAiUsagePanel(model, ui),
    WORKSPACE_STATUS_TITLE: escapeHtml(text.workspaceStatusTitle),
    WORKSPACE_STATUS_SUBTITLE: escapeHtml(text.workspaceStatusSubtitle),
    KV_MEMO_ROOT: escapeHtml(text.kvMemoRoot),
    KV_TODAY_DIRECTORY: escapeHtml(text.kvTodayDirectory),
    KV_TODAY_MEMO_PATH: escapeHtml(text.kvTodayMemoPath),
    KV_DEFAULT_TEMPLATE: escapeHtml(text.kvDefaultTemplate),
    KV_WORKSPACE_FILE: escapeHtml(text.kvWorkspaceFile),
    KV_ADMIN_OPEN_ON_STARTUP: escapeHtml(text.kvAdminOpenOnStartup),
    KV_CONFIGURATION: escapeHtml(text.kvConfiguration),
    MEMO_ROOT: escapeHtml(model.memoRoot || text.notAvailable),
    TODAY_DIRECTORY: escapeHtml(model.todayDirectory || text.notAvailable),
    TODAY_MEMO_PATH: escapeHtml(model.todayMemoPath || text.notAvailable),
    DEFAULT_TEMPLATE: escapeHtml(model.templatePath || text.notAvailable),
    WORKSPACE_FILE_BLOCK: `${escapeHtml(model.workspaceFilePath || text.notAvailable)}<br />${escapeHtml(
      model.workspaceFileExists ? text.created : text.notCreated
    )}`,
    ADMIN_OPEN_ON_STARTUP_CONTROL: renderAdminOpenOnStartupControl(model, ui),
    CONFIG_BLOCK: [
      `<code>datePathFormat</code>: ${escapeHtml(model.datePathFormat)}`,
      `<code>metaDir</code>: ${escapeHtml(model.metaDir)}`,
      `<code>locale</code>: ${escapeHtml(model.locale)}`,
      `<code>adminOpenOnStartup</code>: ${escapeHtml(model.adminOpenOnStartup ? "true" : "false")}`,
      `<code>maxScanDepth</code>: ${escapeHtml(String(model.maxScanDepth))}`,
      `<code>excludeDirectories</code>: ${escapeHtml(model.excludeDirectories.join(", ") || "n/a")}`,
      `<code>indexLoadSource</code>: ${escapeHtml(model.indexLoadSource)}`,
      `<code>indexBackup</code>: ${escapeHtml(model.indexBackupExists ? "present" : "missing")}`,
      `<code>indexTransientBackup</code>: ${escapeHtml(model.indexTransientBackupExists ? "present" : "missing")}`
    ].join("<br />"),
    MAINTENANCE_ASSETS_TITLE: escapeHtml(text.maintenanceAssetsTitle),
    MAINTENANCE_ASSETS_SUBTITLE: escapeHtml(text.maintenanceAssetsSubtitle),
    TEMPLATES_TITLE: escapeHtml(text.templatesTitle),
    TEMPLATES_SUBTITLE: escapeHtml(text.templatesSubtitle),
    SNIPPETS_TITLE: escapeHtml(text.snippetsTitle),
    SNIPPETS_SUBTITLE: escapeHtml(text.snippetsSubtitle),
    TEMPLATE_SECTION: renderTemplateSection(model, ui),
    SNIPPET_SECTION: renderSnippetSection(model, ui),
    SCRIPT: buildAdminScript()
  });
}

function renderActionButtons(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  const dailyButtons: readonly { command: string; label: string; disabled: boolean; variant: "primary" | "default" | "subtle" }[] = [
    { command: "memobox.newMemo", label: text.actionNewMemo, disabled: !model.memoRootReady, variant: "primary" },
    { command: "memobox.quickMemo", label: text.actionQuickMemo, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.listMemos", label: text.actionListMemos, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.listTags", label: text.actionTags, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.grepMemos", label: text.actionGrep, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.todoMemos", label: text.actionTodo, disabled: !model.memoRootReady, variant: "default" }
  ];
  const maintenanceButtons: readonly { command: string; label: string; disabled: boolean; variant: "primary" | "default" | "subtle" }[] = [
    { command: "memobox.openMemoFolder", label: text.actionOpenFolder, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.createWorkspace", label: text.actionCreateWorkspace, disabled: !model.memoRootReady, variant: "default" },
    { command: "memobox.openSetup", label: text.actionOpenSetup, disabled: false, variant: "default" },
    { command: "memobox.refreshIndex", label: text.actionRefreshIndex, disabled: !model.memoRootReady, variant: "subtle" },
    { command: "memobox.rebuildIndex", label: text.actionRebuildIndex, disabled: !model.memoRootReady, variant: "subtle" },
    { command: "memobox.clearIndexCache", label: text.actionClearIndexCache, disabled: !model.memoRootReady, variant: "subtle" },
    { command: "memobox.showLogs", label: text.actionShowLogs, disabled: false, variant: "subtle" },
    { command: "memobox.showAiLogs", label: text.actionShowAiLogs, disabled: false, variant: "subtle" },
    { command: "memobox.aiSetApiKey", label: text.actionSetAiApiKey, disabled: !model.aiEnabled, variant: "subtle" },
    { command: "memobox.aiClearApiKey", label: text.actionClearAiApiKey, disabled: !model.aiEnabled, variant: "subtle" },
    { command: "memobox.admin.refresh", label: text.actionReloadAdmin, disabled: false, variant: "subtle" },
    { command: "memobox.admin.settings", label: text.actionSettings, disabled: false, variant: "subtle" }
  ];

  return [
    renderActionGroup(text.actionGroupDaily, dailyButtons),
    renderActionGroup(text.actionGroupMaintenance, maintenanceButtons)
  ].join("");
}

function renderActionGroup(
  label: string,
  actionButtons: readonly { command: string; label: string; disabled: boolean; variant: "primary" | "default" | "subtle" }[]
): string {
  return `
    <section class="toolbar-group">
      <span class="toolbar-label">${escapeHtml(label)}</span>
      <div class="toolbar-actions">
        ${actionButtons
          .map(
            (button) => `
        <button
          class="action-button action-button-${button.variant}"
          data-command="${button.command}"
          ${button.disabled ? "disabled" : ""}
        >
          ${escapeHtml(button.label)}
        </button>
      `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWarningBanner(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (!model.memoRootReady) {
    return `
      <section class="warning-banner" aria-live="polite">
        <div class="warning-title">
          <span class="status-dot status-dot-danger" aria-hidden="true"></span>
          <strong>${escapeHtml(text.warningTitle)}</strong>
        </div>
        <p>${escapeHtml(text.warningCopy)}</p>
        <div class="asset-actions" style="margin-top: 10px;">
          <button class="mini-button" data-command="memobox.openSetup">${escapeHtml(text.warningOpenSetup)}</button>
        </div>
      </section>
  `;
  }

  if (model.memoRootLooksBroad) {
    return `
      <section class="warning-banner" aria-live="polite">
        <div class="warning-title">
          <span class="status-dot status-dot-warning" aria-hidden="true"></span>
          <strong>${escapeHtml(text.warningBroadRootTitle)}</strong>
        </div>
        <p>${escapeHtml(text.warningBroadRootCopy)}</p>
        ${renderBroadRootReasonLine(model.memoRootRiskCodes, ui)}
        ${renderBroadRootRecommendationLine(model.recommendedMemoRoot, ui)}
        <div class="asset-actions" style="margin-top: 10px;">
          <button class="mini-button" data-use-recommended-root="${escapeHtml(model.recommendedMemoRoot)}">${escapeHtml(text.warningUseRecommendedPath)}</button>
          <button class="mini-button" data-command="memobox.openSetup">${escapeHtml(text.warningOpenSetup)}</button>
          <button class="mini-button" data-command="memobox.openSettings">${escapeHtml(text.actionSettings)}</button>
        </div>
      </section>
  `;
  }

  return "";
}

function renderSummaryCards(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  const maintenanceIssues = getMaintenanceIssueCount(model);
  const summaryCards: readonly {
    label: string;
    value: string;
    detail: string;
    tone: "good" | "warning" | "danger" | "default";
  }[] = [
    {
      label: text.summaryMemoRoot,
      value: model.memoRootReady ? text.summaryMemoRootReady : text.summaryMemoRootNeedsSetup,
      detail: model.memoRoot || "memobox.memodir is not set",
      tone: model.memoRootReady ? "good" : "danger"
    },
    {
      label: text.summaryIndexedMemos,
      value: String(model.totalFiles),
      detail: escapeHtml(text.summaryLatestUpdate(model.latestUpdatedAtLabel)),
      tone: "default"
    },
    {
      label: text.summaryMemoIndex,
      value: model.indexFileExists ? text.summaryAvailable : text.summaryNotCreated,
      detail: `${escapeHtml(model.indexFileSizeLabel)} | ${escapeHtml(model.indexFilePath || text.notAvailable)}`,
      tone: model.indexFileExists ? "good" : "warning"
    },
    {
      label: text.summaryMaintenance,
      value: maintenanceIssues === 0 ? text.summaryHealthy : text.summaryIssues(maintenanceIssues),
      detail: buildMaintenanceDetail(model, ui),
      tone: maintenanceIssues === 0 ? "good" : "warning"
    },
    {
      label: text.summaryAi,
      value: model.aiEnabled ? (model.aiConfigured ? text.summaryAiConfigured : text.summaryAiNeedsSetup) : text.summaryAiOff,
      detail: buildAiDetail(model, ui),
      tone: !model.aiEnabled ? "default" : model.aiConfigured ? "good" : "warning"
    }
  ];

  return summaryCards
    .map(
      (card, index) => `
        <article class="summary-card" data-tone="${card.tone}" ${index === 1 ? 'data-testid="indexed-files-card"' : ""} ${
          index === 2 ? 'data-testid="index-cache-card"' : ""
        }>
          <div class="summary-card-head">
            <span class="summary-label">${escapeHtml(card.label)}</span>
            ${renderToneBadge(card.value, card.tone)}
          </div>
          <span class="summary-value" ${index === 1 ? 'data-testid="indexed-files-value"' : ""}>${escapeHtml(card.value)}</span>
          <span class="summary-detail">${card.detail}</span>
        </article>
      `
    )
    .join("");
}

function buildAdminScript(): string {
  return `
        const vscode = acquireVsCodeApi();

        document.querySelectorAll("[data-command]").forEach((element) => {
          element.addEventListener("click", () => {
            const command = element.getAttribute("data-command");
            if (!command) {
              return;
            }

            vscode.postMessage({ type: "runCommand", command });
          });
        });

        document.querySelectorAll("[data-open-tag]").forEach((element) => {
          element.addEventListener("click", () => {
            const tag = element.getAttribute("data-open-tag");
            if (!tag) {
              return;
            }

            vscode.postMessage({ type: "runCommand", command: "memobox.listTags:" + tag });
          });
        });

        document.querySelectorAll("[data-open-file]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-open-file");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "openFile", path });
          });
        });

        document.querySelectorAll("[data-reveal-path]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-reveal-path");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "revealPath", path });
          });
        });

        document.querySelectorAll("[data-set-template]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-set-template");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "setDefaultTemplate", path });
          });
        });

        document.querySelectorAll("[data-setting-radio='adminOpenOnStartup']").forEach((element) => {
          element.addEventListener("change", () => {
            if (!(element instanceof HTMLInputElement)) {
              return;
            }

            vscode.postMessage({
              type: "setAdminOpenOnStartup",
              value: element.value === "true"
            });
          });
        });

        document.querySelectorAll("[data-clear-template]").forEach((element) => {
          element.addEventListener("click", () => {
            vscode.postMessage({ type: "clearDefaultTemplate" });
          });
        });

        document.querySelectorAll("[data-pin-file]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-pin-file");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "pinFile", path });
          });
        });

        document.querySelectorAll("[data-unpin-file]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-unpin-file");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "unpinFile", path });
          });
        });

        document.querySelectorAll("[data-use-recommended-root]").forEach((element) => {
          element.addEventListener("click", () => {
            const path = element.getAttribute("data-use-recommended-root");
            if (!path) {
              return;
            }

            vscode.postMessage({ type: "useRecommendedMemoRoot", path });
          });
        });
  `.trim();
}

function renderBroadRootReasonLine(
  riskCodes: readonly MemoRootRiskCode[],
  ui: MemoBoxUiText
): string {
  if (riskCodes.length === 0) {
    return "";
  }

  const reasons = riskCodes.map((riskCode) => ui.formatMemoRootRisk(riskCode)).join(", ");
  return `<p class="warning-reasons">${escapeHtml(ui.admin.warningBroadRootReasons(reasons))}</p>`;
}

function renderBroadRootRecommendationLine(recommendedMemoRoot: string, ui: MemoBoxUiText): string {
  if (recommendedMemoRoot.trim() === "") {
    return "";
  }

  return `<p class="warning-reasons">${escapeHtml(ui.admin.warningBroadRootRecommendation(recommendedMemoRoot))}</p>`;
}

function buildAiDetail(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (!model.aiEnabled) {
    return escapeHtml(text.summaryAiDisabledDetail);
  }

  if (!model.aiConfigured) {
    return escapeHtml(model.aiIssueSummary || text.summaryAiNeedsSetupDetail);
  }

  return [
    escapeHtml(model.aiProfileName),
    escapeHtml(model.aiModel),
    escapeHtml(text.summaryAiKey(getAiApiKeySourceLabel(model, ui)))
  ].join(" | ");
}

function renderAiUsagePanel(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (!model.aiEnabled) {
    return "";
  }

  const costLabel = model.aiMonthlyEstimatedCostUsd > 0
    ? formatUsdLabel(model.aiMonthlyEstimatedCostUsd)
    : "$0.00";

  const configRows = [
    { key: "Profile", value: model.aiProfileName },
    { key: "Provider", value: model.aiProvider },
    { key: "Model", value: model.aiModel },
    { key: "Endpoint", value: model.aiEndpoint },
    { key: "API Key", value: getAiApiKeySourceLabel(model, ui) },
    { key: "Cost Mode", value: model.aiCostMode }
  ];

  if (model.aiPerRequestLimitUsd > 0) {
    configRows.push({ key: "Per-request Limit", value: formatUsdLabel(model.aiPerRequestLimitUsd) });
  }

  if (model.aiMonthlyLimitUsd > 0) {
    configRows.push({ key: "Monthly Limit", value: formatUsdLabel(model.aiMonthlyLimitUsd) });
  }

  if (!model.aiConfigured) {
    configRows.length = 0;
    configRows.push({ key: "Status", value: model.aiIssueSummary || text.summaryAiNeedsSetupDetail });
  }

  return `
          <article class="panel" data-testid="ai-usage-panel">
            <div class="panel-head">
              <h2>${escapeHtml(text.summaryAi)}</h2>
              <p class="panel-subtitle">${escapeHtml(model.aiConfigured ? text.summaryAiConfigured : text.summaryAiNeedsSetup)}</p>
            </div>
            <div class="ai-usage-grid">
              <div class="ai-usage-card">
                <span class="ai-usage-value">${escapeHtml(costLabel)}</span>
                <span class="ai-usage-label">Monthly Cost</span>
              </div>
              <div class="ai-usage-card">
                <span class="ai-usage-value">${escapeHtml(String(model.aiMonthlyRequestCount))}</span>
                <span class="ai-usage-label">Requests</span>
              </div>
              <div class="ai-usage-card">
                <span class="ai-usage-value">${escapeHtml(model.aiModel || "n/a")}</span>
                <span class="ai-usage-label">Model</span>
              </div>
            </div>
            <div class="ai-config-grid">
              ${configRows
                .map(
                  (row) => `
              <div class="ai-config-row">
                <code class="ai-config-key">${escapeHtml(row.key)}</code>
                <span class="ai-config-val">${escapeHtml(row.value || "n/a")}</span>
              </div>`
                )
                .join("")}
            </div>
          </article>`;
}

function getAiApiKeySourceLabel(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;

  switch (model.aiApiKeySource) {
    case "settings":
      return text.summaryAiKeySettings;
    case "secretStorage":
      return text.summaryAiKeySecretStorage;
    case "environment":
      return text.summaryAiKeyEnvironment;
    case "notRequired":
      return text.summaryAiKeyNotRequired;
    default:
      return text.summaryAiKeyMissing;
  }
}

function formatUsdLabel(value: number): string {
  if (value > 0 && value < 0.01) {
    return "<$0.01";
  }

  return `$${value.toFixed(2)}`;
}

function renderTemplateSection(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  const statusBadge = renderToneBadge(
    model.templatesDirectoryReady ? text.templatesDirectoryReady : text.templatesDirectoryMissing,
    model.templatesDirectoryReady ? "good" : "warning"
  );

  return `
    <div class="asset-row">
      <div class="asset-header">
        <div>
          <span class="section-label">${escapeHtml(text.labelDirectory)}</span>
          <span class="asset-title">${escapeHtml(model.templatesDirectory || text.notAvailable)}</span>
        </div>
        ${statusBadge}
      </div>
      <div class="asset-meta">
        ${model.templatesDirectoryReady ? escapeHtml(text.templateFiles(model.templates.length)) : escapeHtml(text.templatesDirectoryNotReady)}
      </div>
      <div class="asset-actions" style="margin-top: 10px;">
        <button class="mini-button" data-command="memobox.admin.scaffoldMeta" ${model.memoRootReady ? "" : "disabled"}>${escapeHtml(text.ensureDirs)}</button>
        <button class="mini-button" data-reveal-path="${escapeHtml(model.templatesDirectory)}" ${model.templatesDirectoryReady ? "" : "disabled"}>${escapeHtml(text.reveal)}</button>
      </div>
    </div>
    <ul class="asset-list">
      ${renderTemplateAssets(model.templates, model.hasExplicitTemplateOverride, ui)}
    </ul>
  `;
}

function renderSnippetSection(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  const statusBadge = renderToneBadge(
    model.snippetsDirectoryReady ? text.snippetsDirectoryReady : text.snippetsDirectoryMissing,
    model.snippetsDirectoryReady ? "good" : "warning"
  );

  return `
    <div class="asset-row">
      <div class="asset-header">
        <div>
          <span class="section-label">${escapeHtml(text.labelDirectory)}</span>
          <span class="asset-title">${escapeHtml(model.snippetsDirectory || text.notAvailable)}</span>
        </div>
        ${statusBadge}
      </div>
      <div class="asset-meta">
        ${model.snippetsDirectoryReady ? escapeHtml(text.snippetFiles(model.snippets.length)) : escapeHtml(text.snippetsDirectoryNotReady)}
      </div>
      <div class="asset-actions" style="margin-top: 10px;">
        <button class="mini-button" data-command="memobox.admin.scaffoldMeta" ${model.memoRootReady ? "" : "disabled"}>${escapeHtml(text.ensureDirs)}</button>
        <button class="mini-button" data-reveal-path="${escapeHtml(model.snippetsDirectory)}" ${model.snippetsDirectoryReady ? "" : "disabled"}>${escapeHtml(text.reveal)}</button>
      </div>
    </div>
    <ul class="asset-list">
      ${renderSnippetAssets(model.snippets, ui)}
    </ul>
  `;
}

function renderTemplateAssets(
  templates: readonly AdminTemplateAsset[],
  hasExplicitTemplateOverride: boolean,
  ui: MemoBoxUiText
): string {
  const text = ui.admin;
  if (templates.length === 0) {
    return `
      <li class="asset-row">
        <div class="asset-meta" data-testid="templates-empty">${escapeHtml(text.noTemplateFiles)}</div>
        ${
          hasExplicitTemplateOverride
            ? `<div class="asset-actions" style="margin-top: 10px;"><button class="mini-button" data-clear-template>${escapeHtml(text.clearExplicitDefault)}</button></div>`
            : ""
        }
      </li>
    `;
  }

  return templates
    .map(
      (asset) => `
        <li class="asset-row">
          <div class="asset-header">
            <span class="asset-title" data-testid="template-name">${escapeHtml(asset.name)}</span>
            <div class="asset-actions">
              <button class="mini-button" data-open-file="${escapeHtml(asset.absolutePath)}">${escapeHtml(text.open)}</button>
              ${
                asset.isDefault
                  ? hasExplicitTemplateOverride
                    ? `<button class="mini-button" data-clear-template>${escapeHtml(text.clearExplicitDefault)}</button>`
                    : ""
                  : `<button class="mini-button" data-set-template="${escapeHtml(asset.absolutePath)}">${escapeHtml(text.setDefault)}</button>`
              }
            </div>
          </div>
          <div class="asset-meta">
            ${escapeHtml(asset.isDefault ? text.defaultTemplate : text.availableTemplate)} | ${escapeHtml(asset.sizeLabel)} | ${escapeHtml(asset.updatedAtLabel)}
          </div>
        </li>
      `
    )
    .join("");
}

function renderSnippetAssets(snippets: readonly AdminSnippetAsset[], ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (snippets.length === 0) {
    return `
      <li class="asset-row">
        <div class="asset-meta" data-testid="snippets-empty">${escapeHtml(text.noSnippetFiles)}</div>
      </li>
    `;
  }

  return snippets
    .map(
      (asset) => `
        <li class="asset-row">
          <div class="asset-header">
            <span class="asset-title" data-testid="snippet-name">${escapeHtml(asset.name)}</span>
            <div class="asset-actions">
              <button class="mini-button" data-open-file="${escapeHtml(asset.absolutePath)}">${escapeHtml(text.open)}</button>
            </div>
          </div>
          <div class="asset-meta">
            ${escapeHtml(text.snippets(asset.snippetCount))} | ${escapeHtml(asset.sizeLabel)} | ${escapeHtml(asset.updatedAtLabel)}
          </div>
          ${
            asset.loadError
              ? `<div class="snippet-lines error-text">${escapeHtml(text.failedToLoad(asset.loadError))}</div>`
              : `<ul class="snippet-lines">${asset.snippetSummaries.map((line) => `<li>${escapeHtml(line)}</li>`).join("") || `<li>${escapeHtml(text.noSnippetEntries)}</li>`}</ul>`
          }
        </li>
      `
    )
    .join("");
}

function renderMemoItems(items: readonly AdminMemoFile[], emptyText: string, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (items.length === 0) {
    return `<p class="empty-copy" data-testid="memo-list-empty">${escapeHtml(emptyText)}</p>`;
  }

  return items
    .map(
      (item) => `
        <li class="item-card" data-testid="memo-item">
          <div class="item-row">
            <button class="item-link" data-open-file="${escapeHtml(item.absolutePath)}">
              <span class="item-link-inner">
                <span class="item-path" data-testid="memo-item-path">${escapeHtml(item.relativePath)}</span>
                <span class="item-meta">${escapeHtml(item.updatedAtLabel)}</span>
              </span>
            </button>
            <div class="item-actions">
              <button
                class="mini-button"
                data-testid="${item.isPinned ? "unpin-file-button" : "pin-file-button"}"
                ${item.isPinned ? `data-unpin-file="${escapeHtml(item.absolutePath)}"` : `data-pin-file="${escapeHtml(item.absolutePath)}"`}
              >
                ${escapeHtml(item.isPinned ? text.unpin : text.pin)}
              </button>
            </div>
          </div>
          <span class="item-dir">${escapeHtml(item.parentDirectory)}</span>
        </li>
      `
    )
    .join("");
}

function renderFolderRows(folderCounts: readonly AdminCountRow[], totalFiles: number, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (folderCounts.length === 0) {
    return `<p class="empty-copy">${escapeHtml(text.folderSummaryEmpty)}</p>`;
  }

  return folderCounts
    .map((item) => {
      const ratio = totalFiles === 0 ? 0 : Math.round((item.count / totalFiles) * 100);

      return `
        <li class="folder-row-container">
          <div class="folder-row">
            <span class="folder-name">${escapeHtml(item.label)}</span>
            <span class="folder-meta">
              <span>${escapeHtml(text.files(item.count))}</span>
              <span>${ratio}%</span>
            </span>
          </div>
          <div class="folder-bar-track" aria-hidden="true">
            <div class="folder-bar-fill" style="width: ${ratio}%;"></div>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderTagRows(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  if (model.topTags.length === 0) {
    return `<p class="empty-copy">${escapeHtml(text.tagsEmpty)}</p>`;
  }

  return model.topTags
    .map(
      (tagRow) => `
        <li class="folder-row">
          <button class="item-link" data-open-tag="${escapeHtml(tagRow.tag)}">
            <span class="folder-name">#${escapeHtml(tagRow.tag)}</span>
          </button>
          <span class="folder-meta">
            <span>${escapeHtml(text.memos(tagRow.count))}</span>
          </span>
        </li>
      `
    )
    .join("");
}

function renderAdminOpenOnStartupControl(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;

  return `
    <div class="setting-choice-group" data-testid="admin-open-on-startup-setting">
      <label class="setting-choice">
        <input
          type="radio"
          name="adminOpenOnStartup"
          value="true"
          data-setting-radio="adminOpenOnStartup"
          ${model.adminOpenOnStartup ? "checked" : ""}
        />
        <span>${escapeHtml(text.optionEnabled)}</span>
      </label>
      <label class="setting-choice">
        <input
          type="radio"
          name="adminOpenOnStartup"
          value="false"
          data-setting-radio="adminOpenOnStartup"
          ${model.adminOpenOnStartup ? "" : "checked"}
        />
        <span>${escapeHtml(text.optionDisabled)}</span>
      </label>
    </div>
  `;
}

function getMaintenanceIssueCount(model: AdminDashboardModel): number {
  let count = 0;

  if (!model.templatesDirectoryReady) {
    count += 1;
  }

  if (!model.snippetsDirectoryReady) {
    count += 1;
  }

  if (model.snippets.some((asset) => asset.loadError)) {
    count += 1;
  }

  return count;
}

function buildMaintenanceDetail(model: AdminDashboardModel, ui: MemoBoxUiText): string {
  const text = ui.admin;
  const details = [
    model.templatesDirectoryReady ? text.maintenanceTemplatesReady : text.maintenanceTemplatesMissing,
    model.snippetsDirectoryReady ? text.maintenanceSnippetsReady : text.maintenanceSnippetsMissing
  ];

  if (model.snippets.some((asset) => asset.loadError)) {
    details.push(text.maintenanceSnippetLoadErrors);
  }

  return escapeHtml(details.join(" | "));
}

function renderToneBadge(label: string, tone: "good" | "warning" | "danger" | "default"): string {
  const dotClass =
    tone === "good" ? "status-dot-good" : tone === "warning" ? "status-dot-warning" : tone === "danger" ? "status-dot-danger" : "";

  const dot = dotClass === "" ? "" : `<span class="status-dot ${dotClass}" aria-hidden="true"></span>`;
  return `<span class="status-badge">${dot}${escapeHtml(label)}</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
