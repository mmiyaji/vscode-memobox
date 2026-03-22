import * as vscode from "vscode";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { findRelatedMemos } from "../../core/memo/relatedMemos";
import { openMemoDocument } from "./openMemoDocument";

interface RelatedMemoQuickPickItem extends vscode.QuickPickItem {
  readonly absolutePath: string;
}

export async function relatedMemosCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const activePath = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!activePath) {
    await vscode.window.showInformationMessage("MemoBox: Open a memo file first to find related memos.");
    return;
  }

  const entries = await getMemoIndexEntries(settings);
  const relatedEntries = findRelatedMemos(entries, activePath, settings.relatedMemoLimit);
  if (relatedEntries.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No related memos found for the current file.");
    return;
  }

  const selected = await vscode.window.showQuickPick<RelatedMemoQuickPickItem>(
    relatedEntries.map((entry) => ({
      label: entry.title?.trim() || entry.relativePath,
      description: entry.relativePath,
      detail: entry.reasons.join(" | "),
      absolutePath: entry.absolutePath
    })),
    {
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: `Select a related memo (${relatedEntries.length})`
    }
  );

  if (!selected) {
    return;
  }

  await openMemoDocument(selected.absolutePath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.Beside
  });
}
