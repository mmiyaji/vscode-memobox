import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { defaultMetaDir } from "../../core/config/constants";
import { readSettings } from "../../core/config/settings";
import type { MemoBoxSettings } from "../../core/config/types";
import { getExtensionDisplayVersion } from "../../shared/extensionInfo";
import { getMemoBoxUiText, resolveUiLanguage } from "../../shared/uiText";
import { applyTemplateVariables, extractTemplateKeys, loadWebviewTemplate } from "../../shared/webviewTemplate";
import { buildCustomPages, parseCustomPageContent } from "../admin/adminViewModel";
import { buildCustomPageVariables, buildContentLoops } from "../admin/adminHtml";
import { resolveRequiredGroups, buildCustomPageDataModel } from "./customPageDataGroups";
import {
  buildCustomPageAllowedRoots,
  isAllowedCustomPageCommand,
  isAllowedCustomPagePath,
  isAllowedCustomPageTargetPath
} from "./customPageSecurity";

const customPageViewType = "memobox.customPage";

type CustomPageMessage =
  | { readonly type: "runCommand"; readonly command: string }
  | { readonly type: "openFile"; readonly path: string }
  | { readonly type: "revealPath"; readonly path: string };

export async function openCustomPageByPath(
  context: vscode.ExtensionContext,
  absolutePath: string
): Promise<void> {
  const settings = readSettings();
  const workspacePageDirectories = getWorkspacePageDirectories(settings);
  if (!isAllowedCustomPagePath(settings, absolutePath, workspacePageDirectories)) {
    const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
    void vscode.window.showWarningMessage(ui.pages.blockedPath);
    return;
  }

  const raw = await readFile(absolutePath, "utf8");
  const { title } = parseCustomPageContent(raw, absolutePath);
  await MemoCustomPagePanel.show(context, absolutePath, title);
}

export async function openCustomPagePicker(context: vscode.ExtensionContext): Promise<void> {
  const settings = readSettings();
  const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
  const workspacePageDirectories = getWorkspacePageDirectories(settings);
  const customPages = await buildCustomPages(settings, workspacePageDirectories);

  if (customPages.length === 0) {
    await vscode.window.showInformationMessage(ui.pages.noPagesFound);
    return;
  }

  const items = customPages.map((page) => ({
    label: page.title,
    detail: page.absolutePath,
    absolutePath: page.absolutePath
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: ui.pages.pickerPlaceholder
  });

  if (selected) {
    await openCustomPageByPath(context, selected.absolutePath);
  }
}

class MemoCustomPagePanel {
  private static panels = new Map<string, MemoCustomPagePanel>();

  static async show(
    context: vscode.ExtensionContext,
    absolutePath: string,
    title: string
  ): Promise<void> {
    const existing = MemoCustomPagePanel.panels.get(absolutePath);
    if (existing) {
      existing.panel.reveal(vscode.ViewColumn.One);
      await existing.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      customPageViewType,
      title,
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const instance = new MemoCustomPagePanel(panel, context, absolutePath);
    MemoCustomPagePanel.panels.set(absolutePath, instance);
    await instance.render();
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private readonly absolutePath: string;

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    absolutePath: string
  ) {
    this.panel = panel;
    this.context = context;
    this.absolutePath = absolutePath;

    this.panel.onDidDispose(() => {
      MemoCustomPagePanel.panels.delete(this.absolutePath);
    });

    this.panel.webview.onDidReceiveMessage(async (message: unknown) => {
      await this.handleMessage(message);
    });
  }

  private async render(): Promise<void> {
    const raw = await readFile(this.absolutePath, "utf8");
    const { title, body } = parseCustomPageContent(raw, this.absolutePath);
    const pageBody = extractCustomPageBody(body);

    const usage = extractTemplateKeys(pageBody);
    const requiredGroups = resolveRequiredGroups(usage);

    const settings = readSettings();
    const version = getExtensionDisplayVersion(
      (this.context.extension.packageJSON as { version?: string }).version
    );
    const model = await buildCustomPageDataModel(settings, version, new Date(), requiredGroups);

    const contentVariables = buildCustomPageVariables(model);
    const contentLoops = buildContentLoops(model);
    const renderedBody = applyTemplateVariables(pageBody, contentVariables, contentLoops);

    const wrapper = loadWebviewTemplate("customPage.html");
    const css = loadWebviewTemplate("admin.css");
    const nonce = getNonce();

    this.panel.title = title;
    this.panel.webview.html = applyTemplateVariables(wrapper, {
      NONCE: nonce,
      CSS: css,
      PAGE_TITLE: escapeHtml(title),
      PAGE_BODY: renderedBody,
      SCRIPT: buildCustomPageScript()
    });
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isCustomPageMessage(message)) {
      return;
    }

    const settings = readSettings();
    const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
    const allowedRoots = buildCustomPageAllowedRoots(settings, this.absolutePath, getWorkspacePageDirectories(settings));

    switch (message.type) {
      case "runCommand":
        if (isAllowedCustomPageCommand(message.command)) {
          await vscode.commands.executeCommand(message.command);
        } else {
          void vscode.window.showWarningMessage(ui.pages.blockedCommand);
        }
        return;
      case "openFile":
        if (isAllowedCustomPageTargetPath(message.path, allowedRoots)) {
          await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(message.path));
        } else {
          void vscode.window.showWarningMessage(ui.pages.blockedPath);
        }
        return;
      case "revealPath":
        if (isAllowedCustomPageTargetPath(message.path, allowedRoots)) {
          await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(message.path));
        } else {
          void vscode.window.showWarningMessage(ui.pages.blockedPath);
        }
        return;
    }
  }
}

export function getWorkspacePageDirectories(
  settings: Pick<MemoBoxSettings, "metaDir">
): readonly string[] {
  const meta = settings.metaDir.trim() || defaultMetaDir;
  return vscode.workspace.workspaceFolders?.map((folder) => normalize(join(folder.uri.fsPath, meta, "pages"))) ?? [];
}


function extractCustomPageBody(rawHtml: string): string {
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) {
    return bodyMatch[1].trim();
  }
  return rawHtml;
}

function buildCustomPageScript(): string {
  return `
    const vscode = acquireVsCodeApi();

    document.querySelectorAll("[data-command]").forEach((element) => {
      element.addEventListener("click", () => {
        const command = element.getAttribute("data-command");
        if (command) {
          vscode.postMessage({ type: "runCommand", command });
        }
      });
    });

    document.querySelectorAll("[data-open-file]").forEach((element) => {
      element.addEventListener("click", () => {
        const path = element.getAttribute("data-open-file");
        if (path) {
          vscode.postMessage({ type: "openFile", path });
        }
      });
    });

    document.querySelectorAll("[data-reveal-path]").forEach((element) => {
      element.addEventListener("click", () => {
        const path = element.getAttribute("data-reveal-path");
        if (path) {
          vscode.postMessage({ type: "revealPath", path });
        }
      });
    });
  `.trim();
}

function isCustomPageMessage(value: unknown): value is CustomPageMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type === "runCommand") {
    return typeof candidate.command === "string";
  }
  if (candidate.type === "openFile" || candidate.type === "revealPath") {
    return typeof candidate.path === "string";
  }
  return false;
}

function getNonce(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
