import * as vscode from "vscode";
import { clearMemoIndexStorage, refreshMemoIndexReport } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";

export async function rebuildIndexCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  try {
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

    await vscode.window.showInformationMessage(
      `MemoBox: Index rebuilt (${result.report.entries.length} memos, ${result.report.scannedFiles} scanned, ${result.removedFiles} cleared${skippedSuffix}).`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await vscode.window.showErrorMessage(`MemoBox: Failed to rebuild the memo index. ${message}`);
  }
}
