import * as vscode from "vscode";
import { clearMemoIndexStorage } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { logMemoBoxError, logMemoBoxInfo } from "../../shared/logging";

export async function clearIndexCacheCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const confirmation = await vscode.window.showWarningMessage(
    "MemoBox: Clear the saved memo index files and in-memory cache?",
    { modal: true, detail: "Memo files will remain unchanged. Search and tags will rebuild on the next index refresh." },
    "Clear Index Cache"
  );

  if (confirmation !== "Clear Index Cache") {
    return;
  }

  try {
    const removedFiles = await clearMemoIndexStorage(settings);
    logMemoBoxInfo("index", "Cleared index cache.", { removedFiles });
    await vscode.window.showInformationMessage(
      `MemoBox: Cleared memo index cache (${removedFiles} file${removedFiles === 1 ? "" : "s"} removed).`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logMemoBoxError("index", "Clear index cache failed.", { message });
    await vscode.window.showErrorMessage(`MemoBox: Failed to clear the memo index cache. ${message}`);
  }
}
