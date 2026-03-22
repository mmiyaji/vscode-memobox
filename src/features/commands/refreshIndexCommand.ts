import * as vscode from "vscode";
import { refreshMemoIndex } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";

export async function refreshIndexCommand(options: { readonly silent?: boolean } = {}): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const entries = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title: "MemoBox: Refreshing memo index"
    },
    async () => await refreshMemoIndex(settings)
  );

  if (!options.silent) {
    await vscode.window.showInformationMessage(`MemoBox: Index refreshed (${entries.length} memo${entries.length === 1 ? "" : "s"}).`);
  }
}
