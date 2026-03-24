import { applyTemplateVariables, loadWebviewTemplate } from "../../shared/webviewTemplate";
import type { MemoBoxUiText } from "../../shared/uiText";
import type { MemoRootRiskCode } from "../../core/memo/memoRootGuard";
import type { SetupViewModel } from "./setupViewModel";

export function renderSetupHtml(
  model: SetupViewModel,
  nonce: string,
  step: "memoRoot" | "workspace" | "done",
  ui: MemoBoxUiText
): string {
  const template = loadWebviewTemplate("setup.html");
  const css = loadWebviewTemplate("setup.css");
  const text = ui.setup;

  return applyTemplateVariables(template, {
    NONCE: nonce,
    CSS: css,
    PAGE_TITLE: escapeHtml(text.pageTitle),
    VERSION: escapeHtml(model.version),
    SETUP_TITLE: escapeHtml(text.title),
    SETUP_COPY: escapeHtml(text.heroCopy),
    STEP_PILLS: [
      renderStepPill(text.stepMemoRoot, step === "memoRoot"),
      renderStepPill(text.stepWorkspace, step === "workspace"),
      renderStepPill(text.stepReady, step === "done")
    ].join(""),
    STEP_CONTENT: renderStepContent(model, step, ui),
    SCRIPT: buildSetupScript()
  });
}

function renderStepContent(model: SetupViewModel, step: "memoRoot" | "workspace" | "done", ui: MemoBoxUiText): string {
  switch (step) {
    case "workspace":
      return renderWorkspaceStep(model, ui);
    case "done":
      return renderDoneStep(model, ui);
    case "memoRoot":
    default:
      return renderMemoRootStep(model, ui);
  }
}

function renderMemoRootStep(model: SetupViewModel, ui: MemoBoxUiText): string {
  const text = ui.setup;
  const heading = model.memoRootConfigured ? text.memoRootHeadingFinish : text.memoRootHeadingChoose;
  const copy = model.memoRootConfigured ? text.memoRootCopyFinish : text.memoRootCopyChoose;
  const primaryLabel = model.memoRootConfigured ? text.createThisFolder : text.useSuggestedFolder;
  const pathLabel = model.memoRootConfigured ? text.configuredPath : text.suggestedPath;

  return `
    <div data-testid="setup-step-memo-root">
      <h2 data-testid="setup-root-heading">${escapeHtml(heading)}</h2>
      <p class="muted" style="margin-top: 8px;">${escapeHtml(copy)}</p>
      ${
        model.memoRootLooksBroad
          ? `<div class="warning-banner" data-testid="setup-broad-root-warning"><strong>${escapeHtml(text.broadRootWarningTitle)}</strong><p>${escapeHtml(text.broadRootWarningCopy)}</p>${renderBroadRootReasonLine(model.memoRootRiskCodes, ui, "setup")}${renderBroadRootRecommendationLine(model.recommendedMemoRoot, ui, "setup")}<div class="actions"><button data-testid="setup-use-recommended-folder" data-use-suggested-dir="${escapeHtml(model.recommendedMemoRoot)}">${escapeHtml(text.useRecommendedPath)}</button></div></div>`
          : ""
      }
      <div class="actions">
        <button class="primary" data-testid="setup-use-suggested-folder" data-use-suggested-dir="${escapeHtml(model.setupTargetPath)}">${escapeHtml(primaryLabel)}</button>
        <button data-testid="setup-choose-folder" data-pick-memo-dir>${escapeHtml(text.chooseFolder)}</button>
        <button data-testid="setup-open-settings" data-command="memobox.openSettings">${escapeHtml(text.openSettings)}</button>
      </div>
    </div>
    <div class="stack">
      <section class="info-card" data-testid="setup-target-path-card">
        <span class="label">${escapeHtml(pathLabel)}</span>
        <span class="value">${escapeHtml(model.setupTargetPath)}</span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.storedAs)}</span>
        <span class="value">${escapeHtml(text.storedAsGlobal)}</span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.createdFolders)}</span>
        <span class="value"><code>${escapeHtml(model.metaDir)}/templates</code><br /><code>${escapeHtml(model.metaDir)}/snippets</code></span>
      </section>
    </div>
  `;
}

function renderBroadRootReasonLine(
  riskCodes: readonly MemoRootRiskCode[],
  ui: MemoBoxUiText,
  context: "setup" | "admin"
): string {
  if (riskCodes.length === 0) {
    return "";
  }

  const reasons = riskCodes.map((riskCode) => ui.formatMemoRootRisk(riskCode)).join(", ");
  const message =
    context === "setup" ? ui.setup.broadRootReasons(reasons) : ui.admin.warningBroadRootReasons(reasons);
  return `<p class="warning-reasons">${escapeHtml(message)}</p>`;
}

function renderBroadRootRecommendationLine(
  recommendedMemoRoot: string,
  ui: MemoBoxUiText,
  context: "setup" | "admin"
): string {
  if (recommendedMemoRoot.trim() === "") {
    return "";
  }

  const message =
    context === "setup"
      ? ui.setup.broadRootRecommendation(recommendedMemoRoot)
      : ui.admin.warningBroadRootRecommendation(recommendedMemoRoot);
  return `<p class="warning-reasons">${escapeHtml(message)}</p>`;
}

function renderWorkspaceStep(model: SetupViewModel, ui: MemoBoxUiText): string {
  const text = ui.setup;
  return `
    <div data-testid="setup-step-workspace">
      <h2 data-testid="setup-workspace-heading">${escapeHtml(text.workspaceHeading)}</h2>
      <p class="muted" style="margin-top: 8px;">${escapeHtml(text.workspaceCopy)}</p>
      <div class="actions">
        <button class="primary" data-testid="setup-create-workspace" data-create-workspace>${escapeHtml(text.createWorkspaceFile)}</button>
        <button data-testid="setup-open-memo-folder" data-command="memobox.openMemoFolder">${escapeHtml(text.openMemoFolder)}</button>
        <button data-testid="setup-skip-workspace" data-finish-setup>${escapeHtml(text.skipForNow)}</button>
      </div>
    </div>
    <div class="stack">
      <section class="info-card" data-testid="setup-workspace-file-card">
        <span class="label">${escapeHtml(text.workspaceFile)}</span>
        <span class="value">${escapeHtml(model.workspaceFilePath)}</span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.includedSettings)}</span>
        <span class="value"><code>memobox.adminOpenOnStartup</code><br /><code>memobox.templatesDir = ${escapeHtml(model.metaDir)}/templates</code><br /><code>memobox.snippetsDir = ${escapeHtml(model.metaDir)}/snippets</code></span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.recommendations)}</span>
        <span class="value">MemoBox<br />Markdown All in One</span>
      </section>
    </div>
  `;
}

function renderDoneStep(model: SetupViewModel, ui: MemoBoxUiText): string {
  const text = ui.setup;
  return `
    <div data-testid="setup-step-done">
      <h2 data-testid="setup-done-heading">${escapeHtml(text.readyHeading)}</h2>
      <p class="muted" style="margin-top: 8px;">${escapeHtml(text.readyCopy)}</p>
      <div class="actions">
        <button class="primary" data-testid="setup-create-first-memo" data-command="memobox.newMemo">${escapeHtml(text.createFirstMemo)}</button>
        <button data-testid="setup-open-admin" data-command="memobox.openAdmin">${escapeHtml(text.openAdmin)}</button>
        ${model.workspaceFileExists ? `<button data-testid="setup-open-workspace" data-open-workspace="${escapeHtml(model.workspaceFilePath)}">${escapeHtml(text.openWorkspace)}</button>` : ""}
        <button data-testid="setup-open-memo-folder-ready" data-command="memobox.openMemoFolder">${escapeHtml(text.openMemoFolder)}</button>
      </div>
    </div>
    <div class="stack">
      <section class="info-card">
        <span class="label">${escapeHtml(text.readyMemoRoot)}</span>
        <span class="value">${escapeHtml(model.setupTargetPath)}</span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.workspaceFile)}</span>
        <span class="value">${escapeHtml(model.workspaceFileExists ? model.workspaceFilePath : text.notCreated)}</span>
      </section>
      <section class="info-card">
        <span class="label">${escapeHtml(text.readyNext)}</span>
        <span class="value">${escapeHtml(text.readyNextCopy)}</span>
      </section>
    </div>
  `;
}

function renderStepPill(label: string, active: boolean): string {
  return `<span class="step-pill ${active ? "step-pill-active" : ""}">${escapeHtml(label)}</span>`;
}

function buildSetupScript(): string {
  return `
    const vscode = acquireVsCodeApi();

    document.querySelectorAll("[data-pick-memo-dir]").forEach((element) => {
      element.addEventListener("click", () => {
        vscode.postMessage({ type: "pickMemoDir" });
      });
    });

    document.querySelectorAll("[data-use-suggested-dir]").forEach((element) => {
      element.addEventListener("click", () => {
        const path = element.getAttribute("data-use-suggested-dir") || undefined;
        vscode.postMessage({ type: "useSuggestedMemoDir", path });
      });
    });

    document.querySelectorAll("[data-command]").forEach((element) => {
      element.addEventListener("click", () => {
        const command = element.getAttribute("data-command");
        if (!command) {
          return;
        }

        vscode.postMessage({ type: "runCommand", command });
      });
    });

    document.querySelectorAll("[data-create-workspace]").forEach((element) => {
      element.addEventListener("click", () => {
        vscode.postMessage({ type: "createWorkspaceFile" });
      });
    });

    document.querySelectorAll("[data-open-workspace]").forEach((element) => {
      element.addEventListener("click", () => {
        const path = element.getAttribute("data-open-workspace");
        if (!path) {
          return;
        }

        vscode.postMessage({ type: "openWorkspaceFile", path });
      });
    });

    document.querySelectorAll("[data-finish-setup]").forEach((element) => {
      element.addEventListener("click", () => {
        vscode.postMessage({ type: "finishSetup" });
      });
    });
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
