import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { buildMemoListDetail, buildMemoListLabel, listMemos as readMemoList } from "../../core/memo/listMemos";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { openMemoDocument } from "./openMemoDocument";

interface MemoQuickPickItem extends vscode.QuickPickItem {
  readonly absolutePath: string;
}

export async function listMemos(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const entries = await readMemoList(settings);
  if (entries.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No memo files matched the current list settings.");
    return;
  }

  const items: MemoQuickPickItem[] = entries.map((entry) => ({
    label: buildMemoListLabel(entry.relativePath),
    detail: buildMemoListDetail(entry, settings),
    absolutePath: entry.absolutePath
  }));

  const selected = await vscode.window.showQuickPick(items, {
    ignoreFocusOut: true,
    matchOnDescription: true,
    matchOnDetail: true,
    placeHolder: `Select a memo file (${items.length})`
  });

  if (!selected) {
    return;
  }

  await openMemoDocument(selected.absolutePath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });
}
