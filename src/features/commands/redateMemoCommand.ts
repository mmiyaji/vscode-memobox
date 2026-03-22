import * as vscode from "vscode";
import { access, rename } from "node:fs/promises";
import { clearMemoIndexCache } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { buildRedatedMemoPath, isPathInsideMemoRoot } from "../../core/memo/redateMemo";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { openMemoDocument } from "./openMemoDocument";

export async function redateMemoCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showErrorMessage("MemoBox: Open a memo file before running Re:Date.");
    return;
  }

  if (editor.document.isUntitled) {
    await vscode.window.showErrorMessage("MemoBox: Save the memo file before running Re:Date.");
    return;
  }

  const sourcePath = editor.document.uri.fsPath;
  if (!isPathInsideMemoRoot(memoRoot, sourcePath)) {
    await vscode.window.showInformationMessage("MemoBox: Re:Date only works for files inside memobox.memodir.");
    return;
  }

  const targetPath = buildRedatedMemoPath(sourcePath, new Date());
  if (!targetPath) {
    await vscode.window.showInformationMessage(
      "MemoBox: Re:Date requires a file name like `yyyy-MM-dd-title.md`."
    );
    return;
  }

  if (targetPath === sourcePath) {
    await vscode.window.showInformationMessage("MemoBox: The memo file is already dated today.");
    return;
  }

  const confirmed = await vscode.window.showWarningMessage(
    `MemoBox: Rename this memo to today's date?\n${targetPath}`,
    { modal: true },
    "Rename"
  );
  if (confirmed !== "Rename") {
    return;
  }

  if (editor.document.isDirty) {
    const saved = await editor.document.save();
    if (!saved) {
      await vscode.window.showErrorMessage("MemoBox: Save failed. Re:Date was cancelled.");
      return;
    }
  }

  try {
    await access(targetPath);
    await vscode.window.showErrorMessage("MemoBox: A memo with today's date already exists at the target path.");
    return;
  } catch {
    // Target does not exist.
  }

  await rename(sourcePath, targetPath);
  clearMemoIndexCache();

  await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  await openMemoDocument(targetPath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });

  await vscode.window.showInformationMessage(`MemoBox: Updated memo date to today.\n${targetPath}`);
}
