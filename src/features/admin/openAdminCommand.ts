import * as vscode from "vscode";
import { stat } from "node:fs/promises";
import { ensureMemoMetaDirectories } from "../../core/meta/memoAssets";
import { pinMemoByAbsolutePath, unpinMemoByAbsolutePath } from "../../core/meta/pinnedMemos";
import { readSettings } from "../../core/config/settings";
import { getExtensionDisplayVersion } from "../../shared/extensionInfo";
import { getMemoBoxConfigurationTarget } from "../../shared/configTarget";
import { getMemoBoxUiText, resolveUiLanguage } from "../../shared/uiText";
import { refreshIndexCommand } from "../commands/refreshIndexCommand";
import { listTagsCommand } from "../commands/listTagsCommand";
import { openMemoDocument } from "../commands/openMemoDocument";
import { openSettingsCommand } from "../commands/openSettingsCommand";
import { clearIndexCacheCommand } from "../commands/clearIndexCacheCommand";
import { rebuildIndexCommand } from "../commands/rebuildIndexCommand";
import { renderAdminHtml } from "./adminHtml";
import { buildAdminDashboardModel } from "./adminViewModel";
import { completeMemoBoxSetup } from "../welcome/setupFlow";

const adminViewType = "memobox.admin";
type AdminMessage =
  | { readonly type: "runCommand"; readonly command: string }
  | { readonly type: "openFile"; readonly path: string }
  | { readonly type: "revealPath"; readonly path: string }
  | { readonly type: "setDefaultTemplate"; readonly path: string }
  | { readonly type: "clearDefaultTemplate" }
  | { readonly type: "useRecommendedMemoRoot"; readonly path: string }
  | { readonly type: "pinFile"; readonly path: string }
  | { readonly type: "unpinFile"; readonly path: string };

export function openAdmin(context: vscode.ExtensionContext): void {
  void MemoAdminPanel.show(context);
}

class MemoAdminPanel {
  private static currentPanel: MemoAdminPanel | undefined;

  static async show(context: vscode.ExtensionContext): Promise<void> {
    if (MemoAdminPanel.currentPanel) {
      MemoAdminPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      await MemoAdminPanel.currentPanel.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(adminViewType, "MemoBox", vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true
    });

    MemoAdminPanel.currentPanel = new MemoAdminPanel(panel, context);
    await MemoAdminPanel.currentPanel.render();
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;

    this.panel.onDidDispose(() => {
      if (MemoAdminPanel.currentPanel === this) {
        MemoAdminPanel.currentPanel = undefined;
      }
    });

    this.panel.onDidChangeViewState((event) => {
      if (event.webviewPanel.visible) {
        void this.render();
      }
    });

    this.panel.webview.onDidReceiveMessage(async (message: unknown) => {
      await this.handleMessage(message);
    });
  }

  private async render(): Promise<void> {
    const settings = readSettings();
    const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
    const packageJson = this.context.extension.packageJSON as { version?: string };
    const version = getExtensionDisplayVersion(packageJson.version);
    const model = await buildAdminDashboardModel(settings, version);

    this.panel.title = ui.admin.panelTitle(version);
    this.panel.webview.html = renderAdminHtml(model, getNonce(), ui);
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isAdminMessage(message)) {
      return;
    }

    switch (message.type) {
      case "runCommand":
        await this.runRequestedCommand(message.command);
        await this.render();
        return;
      case "openFile":
        await this.openFile(message.path);
        return;
      case "revealPath":
        await this.revealPath(message.path);
        return;
      case "setDefaultTemplate":
        await this.setDefaultTemplate(message.path);
        await this.render();
        return;
      case "clearDefaultTemplate":
        await this.clearDefaultTemplate();
        await this.render();
        return;
      case "useRecommendedMemoRoot":
        await this.useRecommendedMemoRoot(message.path);
        await this.render();
        return;
      case "pinFile":
        await this.pinFile(message.path);
        await this.render();
        return;
      case "unpinFile":
        await this.unpinFile(message.path);
        await this.render();
        return;
      default:
        return;
    }
  }

  private async runRequestedCommand(command: string): Promise<void> {
    if (command.startsWith("memobox.listTags:")) {
      await listTagsCommand(command.slice("memobox.listTags:".length));
      return;
    }

    switch (command) {
      case "memobox.admin.refresh":
        await refreshIndexCommand({ silent: true });
        return;
      case "memobox.admin.settings":
      case "memobox.openSettings":
        await openSettingsCommand();
        return;
      case "memobox.openSetup":
        await vscode.commands.executeCommand("memobox.openSetup");
        return;
      case "memobox.admin.scaffoldMeta":
        await this.scaffoldMetaDirectories();
        return;
      case "memobox.newMemo":
      case "memobox.quickMemo":
      case "memobox.listMemos":
      case "memobox.listTags":
      case "memobox.grepMemos":
      case "memobox.todoMemos":
      case "memobox.aiGenerateTitle":
      case "memobox.aiSummarize":
      case "memobox.aiAutoTag":
      case "memobox.aiProofread":
      case "memobox.aiTranslate":
      case "memobox.aiQuestion":
      case "memobox.aiSuggestTemplate":
      case "memobox.aiReport":
      case "memobox.aiLinkSuggest":
      case "memobox.aiSetApiKey":
      case "memobox.aiClearApiKey":
      case "memobox.redateMemo":
      case "memobox.createWorkspace":
        await vscode.commands.executeCommand(command);
        return;
      case "memobox.refreshIndex":
        await refreshIndexCommand();
        return;
      case "memobox.rebuildIndex":
        await rebuildIndexCommand();
        return;
      case "memobox.clearIndexCache":
        await clearIndexCacheCommand();
        return;
      case "memobox.openMemoFolder":
        await vscode.commands.executeCommand(command);
        return;
      default:
        return;
    }
  }

  private async openFile(filePath: string): Promise<void> {
    const settings = readSettings();

    try {
      const info = await stat(filePath);
      if (!info.isFile()) {
        return;
      }
    } catch {
      const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
      await vscode.window.showErrorMessage(ui.admin.errorFileUnavailable);
      await this.render();
      return;
    }

    await openMemoDocument(filePath, settings, {
      preview: true,
      preserveFocus: false,
      viewColumn: vscode.ViewColumn.One
    });
  }

  private async revealPath(filePath: string): Promise<void> {
    if (filePath.trim() === "") {
      return;
    }

    try {
      await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(filePath));
    } catch {
      const settings = readSettings();
      const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
      await vscode.window.showErrorMessage(ui.admin.errorRevealFailed);
    }
  }

  private async setDefaultTemplate(filePath: string): Promise<void> {
    await vscode.workspace.getConfiguration("memobox").update("memotemplate", filePath, getMemoBoxConfigurationTarget());
  }

  private async clearDefaultTemplate(): Promise<void> {
    await vscode.workspace.getConfiguration("memobox").update("memotemplate", "", getMemoBoxConfigurationTarget());
  }

  private async useRecommendedMemoRoot(directoryPath: string): Promise<void> {
    if (directoryPath.trim() === "") {
      return;
    }

    const settings = readSettings();
    await completeMemoBoxSetup(settings, directoryPath);
  }

  private async pinFile(filePath: string): Promise<void> {
    const settings = readSettings();
    await pinMemoByAbsolutePath(settings, filePath);
  }

  private async unpinFile(filePath: string): Promise<void> {
    const settings = readSettings();
    await unpinMemoByAbsolutePath(settings, filePath);
  }

  private async scaffoldMetaDirectories(): Promise<void> {
    const settings = readSettings();
    if (settings.memodir.trim() === "") {
      const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
      await vscode.window.showErrorMessage(ui.admin.errorSetMemoDirBeforeScaffold);
      return;
    }

    await ensureMemoMetaDirectories(settings);
  }
}

function isAdminMessage(value: unknown): value is AdminMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type === "runCommand") {
    return typeof candidate.command === "string";
  }

  if (candidate.type === "openFile") {
    return typeof candidate.path === "string";
  }

  if (candidate.type === "revealPath" || candidate.type === "setDefaultTemplate") {
    return typeof candidate.path === "string";
  }

  if (candidate.type === "clearDefaultTemplate") {
    return true;
  }

  if (candidate.type === "useRecommendedMemoRoot") {
    return typeof candidate.path === "string";
  }

  if (candidate.type === "pinFile" || candidate.type === "unpinFile") {
    return typeof candidate.path === "string";
  }

  return false;
}

function getNonce(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
