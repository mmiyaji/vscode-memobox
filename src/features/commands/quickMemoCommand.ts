import * as vscode from "vscode";
import { access, writeFile } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { ensureMemoDateDirectory, getQuickMemoFilePath } from "../../core/memo/pathing";
import { buildQuickMemoAppendText, buildQuickMemoInitialContent } from "../../core/memo/quickMemo";
import { ensureMemoRoot, getActiveSelectionText } from "../../core/memo/workspace";

export async function quickMemo(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const now = new Date();
  await ensureMemoDateDirectory(settings, now);

  const filePath = getQuickMemoFilePath(settings, now);
  if (!await fileExists(filePath)) {
    await writeFile(filePath, buildQuickMemoInitialContent(now, settings.dateFormat), "utf8");
  }

  const document = await vscode.workspace.openTextDocument(filePath);
  const editor = await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });

  const appendText = buildQuickMemoAppendText({
    currentContent: document.getText(),
    date: now,
    selectedText: getActiveSelectionText(),
    titlePrefix: settings.titlePrefix,
    dateFormat: settings.dateFormat
  });
  const endPosition = document.positionAt(document.getText().length);

  await editor.edit((editBuilder) => {
    editBuilder.insert(endPosition, appendText);
  });

  await document.save();

  const updatedEnd = editor.document.positionAt(editor.document.getText().length);
  editor.selection = new vscode.Selection(updatedEnd, updatedEnd);
  editor.revealRange(new vscode.Range(updatedEnd, updatedEnd));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
