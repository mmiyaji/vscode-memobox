import * as vscode from "vscode";
import { refreshMemoIndexReport } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { logMemoBoxError, logMemoBoxInfo, logMemoBoxWarn } from "../../shared/logging";

export async function refreshIndexCommand(options: { readonly silent?: boolean } = {}): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  try {
    logMemoBoxInfo("index", "Refresh index started.", { silent: options.silent === true });
    const report = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: "MemoBox: Refreshing memo index"
      },
      async () => await refreshMemoIndexReport(settings)
    );

    if (report.skippedFiles > 0) {
      logMemoBoxWarn("index", "Index refresh completed with skipped files.", {
        skippedFiles: report.skippedFiles,
        scannedFiles: report.scannedFiles
      });
      await vscode.window.showWarningMessage(
        `MemoBox: Index refreshed with ${report.skippedFiles} skipped file${report.skippedFiles === 1 ? "" : "s"}.`
      );
    }

    logMemoBoxInfo("index", "Refresh index completed.", {
      entries: report.entries.length,
      scannedFiles: report.scannedFiles,
      skippedFiles: report.skippedFiles
    });

    if (!options.silent) {
      await vscode.window.showInformationMessage(
        `MemoBox: Index refreshed (${report.entries.length} memo${report.entries.length === 1 ? "" : "s"}, ${report.scannedFiles} scanned).`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logMemoBoxError("index", "Refresh index failed.", { message });
    await vscode.window.showErrorMessage(`MemoBox: Failed to refresh the memo index. ${message}`);
  }
}
