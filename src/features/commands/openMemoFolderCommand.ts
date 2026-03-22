import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";

export async function openMemoFolderCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(memoRoot), true);
}
