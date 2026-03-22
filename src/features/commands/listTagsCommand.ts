import * as vscode from "vscode";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import type { MemoIndexedEntry } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { buildMemoListDetail } from "../../core/memo/listMemos";
import { buildMemoTagSummaries, filterEntriesByTag } from "../../core/memo/tags";
import { openMemoDocument } from "./openMemoDocument";

interface TagQuickPickItem extends vscode.QuickPickItem {
  readonly tag: string;
}

export async function listTagsCommand(initialTag?: string): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const entries = await getMemoIndexEntries(settings);
  const selectedTag = await pickTag(entries, initialTag);
  if (!selectedTag) {
    return;
  }

  const taggedEntries = filterEntriesByTag(entries, selectedTag);
  if (taggedEntries.length === 0) {
    await vscode.window.showInformationMessage(`MemoBox: No memos found for tag "${selectedTag}".`);
    return;
  }

  const selectedMemo = await vscode.window.showQuickPick(
    taggedEntries.map((entry) => ({
      label: entry.title?.trim() || entry.relativePath,
      description: `#${selectedTag}`,
      detail: `${entry.relativePath} | ${buildMemoListDetail(entry, settings)}`,
      absolutePath: entry.absolutePath
    })),
    {
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: `Select a memo for #${selectedTag} (${taggedEntries.length})`
    }
  );

  if (!selectedMemo) {
    return;
  }

  await openMemoDocument(selectedMemo.absolutePath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });
}

async function pickTag(
  entries: readonly MemoIndexedEntry[],
  initialTag?: string
): Promise<string | undefined> {
  const summaries = buildMemoTagSummaries(entries);
  if (summaries.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No tags found in memo frontmatter.");
    return undefined;
  }

  const normalizedInitialTag = initialTag?.trim().toLowerCase() ?? "";
  if (normalizedInitialTag !== "") {
    const matched = summaries.find((summary) => summary.tag.toLowerCase() === normalizedInitialTag);
    if (matched) {
      return matched.tag;
    }
  }

  const selected = await vscode.window.showQuickPick<TagQuickPickItem>(
    summaries.map((summary) => ({
      label: summary.tag,
      description: `${summary.count} memo${summary.count === 1 ? "" : "s"}`,
      tag: summary.tag
    })),
    {
      ignoreFocusOut: true,
      matchOnDescription: true,
      placeHolder: `Select a tag (${summaries.length})`
    }
  );

  return selected?.tag;
}
