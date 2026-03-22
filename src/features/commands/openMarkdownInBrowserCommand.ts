import * as vscode from "vscode";
import { isMarkdownDocument, writeMarkdownBrowserPreview } from "../../core/external/markdownBrowserPreview";

export async function openMarkdownInBrowserCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showErrorMessage("MemoBox: Open a Markdown document before using browser preview.");
    return;
  }

  const { document } = editor;
  if (!isMarkdownDocument(document)) {
    await vscode.window.showErrorMessage("MemoBox: Browser preview is only available for Markdown documents.");
    return;
  }

  try {
    const previewPath = await writeMarkdownBrowserPreview(document);
    await vscode.env.openExternal(vscode.Uri.file(previewPath));
  } catch {
    await vscode.window.showErrorMessage("MemoBox: Failed to open the rendered Markdown preview in your browser.");
  }
}
