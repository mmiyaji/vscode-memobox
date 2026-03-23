import * as vscode from "vscode";
import { clearMemoIndexStorage, refreshMemoIndexReport } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { logMemoBoxError, logMemoBoxInfo } from "../../shared/logging";

export async function rebuildIndexCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  try {
    logMemoBoxInfo("index", "Rebuild index started.");
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: "MemoBox: Rebuilding memo index"
      },
      async () => {
        const removedFiles = await clearMemoIndexStorage(settings);
        const report = await refreshMemoIndexReport(settings);
        return { removedFiles, report };
      }
    );

    const skippedSuffix =
      result.report.skippedFiles > 0
        ? `, ${result.report.skippedFiles} skipped`
        : "";

    logMemoBoxInfo("index", "Rebuild index completed.", {
      entries: result.report.entries.length,
      scannedFiles: result.report.scannedFiles,
      skippedFiles: result.report.skippedFiles,
      removedFiles: result.removedFiles
    });
    await vscode.window.showInformationMessage(
      `MemoBox: Index rebuilt (${result.report.entries.length} memos, ${result.report.scannedFiles} scanned, ${result.removedFiles} cleared${skippedSuffix}).`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logMemoBoxError("index", "Rebuild index failed.", { message });
    await vscode.window.showErrorMessage(`MemoBox: Failed to rebuild the memo index. ${message}`);
  }
}
