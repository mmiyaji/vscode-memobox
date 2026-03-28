import * as vscode from "vscode";
import { access } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { getMemoIndexEntries, noteMemoIndexFileDelete } from "../../core/index/memoIndex";
import { findMemoBacklinks } from "../../core/memo/backlinks";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { resolveUiLanguage } from "../../shared/uiText";
import { openMemoDocument } from "./openMemoDocument";

type BacklinkMatch = Awaited<ReturnType<typeof findMemoBacklinks>>[number];

export async function showBacklinksCommand(): Promise<void> {
  try {
    const settings = readSettings();
    const language = resolveUiLanguage(settings.locale);
    const text = getBacklinksText(language);
    const memoRoot = await ensureMemoRoot(settings);
    if (!memoRoot) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      void vscode.window.showInformationMessage(text.openMemoFirst);
      return;
    }

    const entries = await getMemoIndexEntries(settings);
    const matches = await findMemoBacklinks(entries, editor.document.uri.fsPath);
    const existingMatches = await filterExistingBacklinks(matches);
    if (existingMatches.length === 0) {
      void vscode.window.showInformationMessage(text.noBacklinks);
      return;
    }

    const selected = await vscode.window.showQuickPick(
      existingMatches.map((match) => ({
        label: match.sourceLabel,
        description: `${match.sourceRelativePath}:${match.line}`,
        detail: match.preview,
        match
      })),
      {
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: text.pickerPlaceholder
      }
    );

    if (!selected) {
      return;
    }

    if (!(await fileExists(selected.match.sourcePath))) {
      noteMemoIndexFileDelete(selected.match.sourcePath);
      void vscode.window.showWarningMessage(text.sourceMissing);
      return;
    }

    const targetEditor = await openMemoDocument(selected.match.sourcePath, settings, {
      preview: true,
      preserveFocus: false,
      viewColumn: vscode.ViewColumn.One
    });

    const position = new vscode.Position(selected.match.line - 1, Math.max(selected.match.column - 1, 0));
    targetEditor.selection = new vscode.Selection(position, position);
    targetEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const language = resolveUiLanguage(readSettings().locale);
    const text = getBacklinksText(language);
    void vscode.window.showErrorMessage(`${text.failedPrefix} ${detail}`);
  }
}

async function filterExistingBacklinks(matches: readonly BacklinkMatch[]): Promise<readonly BacklinkMatch[]> {
  const existence = await Promise.all(matches.map(async (match) => await fileExists(match.sourcePath)));
  const kept = matches.filter((_, index) => existence[index] === true);
  matches.forEach((match, index) => {
    if (existence[index] !== true) {
      noteMemoIndexFileDelete(match.sourcePath);
    }
  });
  return kept;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getBacklinksText(language: "ja" | "en"): {
  readonly openMemoFirst: string;
  readonly noBacklinks: string;
  readonly pickerPlaceholder: string;
  readonly sourceMissing: string;
  readonly failedPrefix: string;
} {
  if (language === "ja") {
    return {
      openMemoFirst: "MemoBox: Backlinks を使う前にメモファイルを開いてください。",
      noBacklinks: "MemoBox: 現在のメモを参照しているメモは見つかりませんでした。",
      pickerPlaceholder: "開く Backlink を選択してください",
      sourceMissing: "MemoBox: 選択した参照元メモはすでに存在しません。インデックスを更新しました。",
      failedPrefix: "MemoBox: Backlinks の表示に失敗しました。"
    };
  }

  return {
    openMemoFirst: "MemoBox: Open a memo file to view backlinks.",
    noBacklinks: "MemoBox: No backlinks found for the active memo.",
    pickerPlaceholder: "Select a backlink to open",
    sourceMissing: "MemoBox: The selected backlink source no longer exists. The index was updated.",
    failedPrefix: "MemoBox: Failed to show backlinks."
  };
}
