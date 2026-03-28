import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { formatMarkdownTable } from "../../core/text/formatMarkdownTable";
import { resolveUiLanguage } from "../../shared/uiText";

export async function formatMarkdownTableCommand(): Promise<void> {
  const language = resolveUiLanguage(readSettings().locale);
  const text = getFormatMarkdownTableText(language);
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  if (selectedText.trim() === "") {
    void vscode.window.showInformationMessage(text.selectTableFirst);
    return;
  }

  const formatted = formatMarkdownTable(selectedText);
  if (!formatted) {
    void vscode.window.showInformationMessage(text.notMarkdownTable);
    return;
  }

  await editor.edit((editBuilder) => {
    editBuilder.replace(selection, formatted);
  });
}

function getFormatMarkdownTableText(language: "ja" | "en"): {
  readonly selectTableFirst: string;
  readonly notMarkdownTable: string;
} {
  if (language === "ja") {
    return {
      selectTableFirst: "MemoBox: 整形する Markdown テーブルを選択してください。",
      notMarkdownTable: "MemoBox: 選択範囲は Markdown テーブルとして認識できませんでした。"
    };
  }

  return {
    selectTableFirst: "MemoBox: Select a Markdown table before formatting.",
    notMarkdownTable: "MemoBox: The selected text does not look like a Markdown table."
  };
}
