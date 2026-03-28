import * as vscode from "vscode";
import { access, writeFile } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { ensureMemoDateDirectory, getMemoFilePath } from "../../core/memo/pathing";
import { buildNewMemoContent } from "../../core/memo/template";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { buildRelativeMarkdownMemoLink, getMemoLinkLabel } from "../../core/memo/memoLinks";
import { detectWikiLinkAtPosition, findExactMemoByWikiLabel } from "../../core/memo/wikilinks";
import { noteMemoIndexFileUpsert } from "../../core/index/memoIndex";
import { resolveUiLanguage } from "../../shared/uiText";
import { openMemoDocument } from "./openMemoDocument";

export async function openOrCreateWikiMemoCommand(): Promise<void> {
  const settings = readSettings();
  const language = resolveUiLanguage(settings.locale);
  const text = getWikiMemoCommandText(language);
  const memoRoot = await ensureMemoRoot(settings);
  if (!memoRoot) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.scheme !== "file") {
    void vscode.window.showInformationMessage(text.openMemoFirst);
    return;
  }

  const lineText = editor.document.lineAt(editor.selection.active.line).text;
  const wikiTarget = detectWikiLinkAtPosition(lineText, editor.selection.active.character);
  if (!wikiTarget || wikiTarget.query.trim() === "") {
    void vscode.window.showInformationMessage(text.placeCursorInsideWikiLink);
    return;
  }

  const entries = await getMemoIndexEntries(settings);
  const existingMemo = findExactMemoByWikiLabel(entries, editor.document.uri.fsPath, wikiTarget.query);
  const now = new Date();
  let targetPath = existingMemo?.absolutePath;

  if (!targetPath) {
    await ensureMemoDateDirectory(settings, now);
    targetPath = getMemoFilePath(settings, now, wikiTarget.query);
    const exists = await fileExists(targetPath);
    if (!exists) {
      const content = await buildNewMemoContent(settings, wikiTarget.query, now);
      await writeFile(targetPath, content, "utf8");
      noteMemoIndexFileUpsert(targetPath);
    }
  }

  const targetLabel = existingMemo ? getMemoLinkLabel(existingMemo) : wikiTarget.query.trim();
  const replacement = buildRelativeMarkdownMemoLink(editor.document.uri.fsPath, targetPath, targetLabel);
  const range = new vscode.Range(
    editor.selection.active.line,
    wikiTarget.startCharacter,
    editor.selection.active.line,
    wikiTarget.endCharacter
  );
  await editor.edit((editBuilder) => {
    editBuilder.replace(range, replacement);
  });

  await editor.document.save();
  await openMemoDocument(targetPath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getWikiMemoCommandText(language: "ja" | "en"): {
  readonly openMemoFirst: string;
  readonly placeCursorInsideWikiLink: string;
} {
  if (language === "ja") {
    return {
      openMemoFirst: "MemoBox: メモファイルを開いて `[[memo]]` の上にカーソルを置いてください。",
      placeCursorInsideWikiLink: "MemoBox: `[[memo]]` のような Wiki リンクの内側にカーソルを置いてください。"
    };
  }

  return {
    openMemoFirst: "MemoBox: Open a memo file and place the cursor inside `[[memo]]`.",
    placeCursorInsideWikiLink: "MemoBox: Place the cursor inside a wiki link like `[[memo]]`."
  };
}
