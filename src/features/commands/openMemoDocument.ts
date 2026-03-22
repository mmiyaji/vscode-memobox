import * as vscode from "vscode";
import { extname } from "node:path";
import type { MemoBoxSettings } from "../../core/config/types";

const markdownExtensions = new Set([".md", ".markdown", ".mdown", ".mkd"]);

export async function openMemoDocument(
  filePath: string,
  settings: Pick<MemoBoxSettings, "openMarkdownPreview">,
  options: {
    readonly preview: boolean;
    readonly preserveFocus: boolean;
    readonly viewColumn?: vscode.ViewColumn;
  }
): Promise<vscode.TextEditor> {
  const document = await vscode.workspace.openTextDocument(filePath);
  const editor = await vscode.window.showTextDocument(document, {
    preview: options.preview,
    preserveFocus: options.preserveFocus,
    viewColumn: options.viewColumn ?? vscode.ViewColumn.One
  });

  if (settings.openMarkdownPreview && isMarkdownMemoPath(filePath)) {
    await vscode.commands.executeCommand("markdown.showPreviewToSide");
    await vscode.commands.executeCommand("workbench.action.focusPreviousGroup");
  }

  return editor;
}

function isMarkdownMemoPath(filePath: string): boolean {
  return markdownExtensions.has(extname(filePath).toLowerCase());
}
