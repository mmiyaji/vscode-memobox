import * as vscode from "vscode";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { buildMemoLinkCandidates, buildRelativeMarkdownMemoLink, getMemoLinkLabel } from "../../core/memo/memoLinks";
import { areSameFilePath } from "../../shared/filePathComparison";
import { ensureMemoRoot } from "../../core/memo/workspace";

interface MemoLinkQuickPickItem extends vscode.QuickPickItem {
  readonly absolutePath: string;
  readonly linkLabel: string;
}

export async function insertMemoLinkCommand(): Promise<void> {
  const settings = readSettings();
  if (!(await ensureMemoRoot(settings))) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.isUntitled || editor.document.uri.scheme !== "file") {
    await vscode.window.showInformationMessage("MemoBox: Open a saved memo file first to insert a memo link.");
    return;
  }

  const currentMemoPath = editor.document.uri.fsPath;
  const selectedText = editor.selection.isEmpty ? "" : editor.document.getText(editor.selection).trim();
  const entries = await getMemoIndexEntries(settings);
  const candidates = buildMemoLinkCandidates(entries, currentMemoPath, {
    query: selectedText,
    limit: 100
  });
  const fallbackCandidates =
    candidates.length === 0 && selectedText !== ""
      ? buildMemoLinkCandidates(entries, currentMemoPath, { limit: 100 })
      : candidates;

  if (fallbackCandidates.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No candidate memo files were found for link insertion.");
    return;
  }

  const selected = await vscode.window.showQuickPick<MemoLinkQuickPickItem>(
    fallbackCandidates.map((candidate) => ({
      label: candidate.label,
      description: candidate.relativePath,
      detail: candidate.detail,
      absolutePath: candidate.absolutePath,
      linkLabel: selectedText || candidate.label
    })),
    {
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder:
        selectedText !== ""
          ? `Select a memo link target for "${selectedText}" (${fallbackCandidates.length})`
          : `Select a memo to insert as a link (${fallbackCandidates.length})`
    }
  );

  if (!selected) {
    return;
  }

  const targetEntry = entries.find((entry) => areSameFilePath(entry.absolutePath, selected.absolutePath));
  const fallbackLabel = targetEntry ? getMemoLinkLabel(targetEntry) : selected.label;
  const linkLabel = selectedText || selected.linkLabel || fallbackLabel;
  const markdownLink = buildRelativeMarkdownMemoLink(currentMemoPath, selected.absolutePath, linkLabel);
  const targetRange = new vscode.Range(editor.selection.start, editor.selection.end);

  await editor.edit((editBuilder) => {
    editBuilder.replace(targetRange, markdownLink);
  });
}
