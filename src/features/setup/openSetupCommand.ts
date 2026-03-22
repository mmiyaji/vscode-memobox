import * as vscode from "vscode";
import { stat } from "node:fs/promises";
import { buildSetupViewModel } from "./setupViewModel";
import { renderSetupHtml } from "./setupHtml";
import { readSettings } from "../../core/config/settings";
import { completeMemoBoxSetup, isReadyMemoRoot, pickMemoRootFromDialog } from "../welcome/setupFlow";
import { createWorkspaceCommand, openWorkspaceFile } from "../commands/createWorkspaceCommand";
import { getExtensionDisplayVersion } from "../../shared/extensionInfo";
import { getMemoBoxUiText, resolveUiLanguage } from "../../shared/uiText";

const setupViewType = "memobox.setup";

type SetupMessage =
  | { readonly type: "pickMemoDir" }
  | { readonly type: "useSuggestedMemoDir"; readonly path?: string }
  | { readonly type: "createWorkspaceFile" }
  | { readonly type: "openWorkspaceFile"; readonly path: string }
  | { readonly type: "finishSetup" }
  | { readonly type: "runCommand"; readonly command: string };

export function openSetup(context: vscode.ExtensionContext): void {
  void MemoSetupPanel.show(context);
}

class MemoSetupPanel {
  private static currentPanel: MemoSetupPanel | undefined;

  static async show(context: vscode.ExtensionContext): Promise<void> {
    if (MemoSetupPanel.currentPanel) {
      MemoSetupPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      await MemoSetupPanel.currentPanel.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(setupViewType, "MemoBox Setup", vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true
    });

    MemoSetupPanel.currentPanel = new MemoSetupPanel(panel, context);
    await MemoSetupPanel.currentPanel.render();
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private currentStep: "memoRoot" | "workspace" | "done" = "memoRoot";

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;

    this.panel.onDidDispose(() => {
      if (MemoSetupPanel.currentPanel === this) {
        MemoSetupPanel.currentPanel = undefined;
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
    const workspaceFileExists = await this.readWorkspaceFileExists(settings.memodir);
    const model = buildSetupViewModel(settings, version, workspaceFileExists);
    const step = await this.resolveCurrentStep(settings.memodir, workspaceFileExists);

    this.panel.title = ui.setup.panelTitle(version);
    this.panel.webview.html = renderSetupHtml(model, getNonce(), step, ui);
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isSetupMessage(message)) {
      return;
    }

    switch (message.type) {
      case "pickMemoDir":
        await this.pickMemoDir();
        await this.render();
        return;
      case "useSuggestedMemoDir":
        await this.useSuggestedMemoDir(message.path);
        await this.render();
        return;
      case "createWorkspaceFile":
        await this.createWorkspaceFile();
        await this.render();
        return;
      case "openWorkspaceFile":
        await this.openWorkspaceFile(message.path);
        return;
      case "finishSetup":
        this.currentStep = "done";
        await this.render();
        return;
      case "runCommand":
        await vscode.commands.executeCommand(message.command);
        if (message.command === "memobox.openAdmin") {
          this.panel.dispose();
        }
        return;
      default:
        return;
    }
  }

  private async pickMemoDir(): Promise<void> {
    const selectedPath = await pickMemoRootFromDialog();
    if (!selectedPath) {
      return;
    }

    await this.useSuggestedMemoDir(selectedPath);
  }

  private async useSuggestedMemoDir(directoryPath?: string): Promise<void> {
    const settings = readSettings();
    const memoRoot = await completeMemoBoxSetup(settings, directoryPath);
    if (!memoRoot) {
      return;
    }

    this.currentStep = "workspace";
    const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
    await vscode.window.showInformationMessage(ui.setup.memoRootReadyMessage(memoRoot));
  }

  private async createWorkspaceFile(): Promise<void> {
    const workspaceFilePath = await createWorkspaceCommand();
    if (!workspaceFilePath) {
      return;
    }

    this.currentStep = "done";
  }

  private async openWorkspaceFile(workspaceFilePath: string): Promise<void> {
    try {
      await openWorkspaceFile(workspaceFilePath);
    } catch {
      const settings = readSettings();
      const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
      await vscode.window.showErrorMessage(ui.setup.workspaceOpenFailed);
    }
  }

  private async resolveCurrentStep(memodir: string, workspaceFileExists: boolean): Promise<"memoRoot" | "workspace" | "done"> {
    const memoRootReady = await isReadyMemoRoot(memodir);

    if (!memoRootReady) {
      return "memoRoot";
    }

    if (this.currentStep === "done") {
      return "done";
    }

    return workspaceFileExists ? "done" : "workspace";
  }

  private async readWorkspaceFileExists(memodir: string): Promise<boolean> {
    const trimmedRoot = memodir.trim();
    if (trimmedRoot === "") {
      return false;
    }

    const settings = readSettings();
    const model = buildSetupViewModel(settings, "", false);
    try {
      const info = await stat(model.workspaceFilePath);
      return info.isFile();
    } catch {
      return false;
    }
  }
}

function isSetupMessage(value: unknown): value is SetupMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type === "pickMemoDir" || candidate.type === "createWorkspaceFile" || candidate.type === "finishSetup") {
    return true;
  }

  if (candidate.type === "useSuggestedMemoDir") {
    return candidate.path === undefined || typeof candidate.path === "string";
  }

  if (candidate.type === "openWorkspaceFile") {
    return typeof candidate.path === "string";
  }

  if (candidate.type === "runCommand") {
    return typeof candidate.command === "string";
  }

  return false;
}

function getNonce(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
