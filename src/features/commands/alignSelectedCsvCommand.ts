import * as vscode from "vscode";

import { alignDelimitedColumns } from "../../core/text/alignDelimitedColumns";
import { readSettings } from "../../core/config/settings";
import { resolveUiLanguage } from "../../shared/uiText";

export async function alignSelectedCsvCommand(): Promise<void> {
  const language = resolveUiLanguage(readSettings().locale);
  const text = getAlignCsvCommandText(language);
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    void vscode.window.showInformationMessage(text.openEditorFirst);
    return;
  }

  const nonEmptySelections = editor.selections.filter((selection) => !selection.isEmpty);
  if (nonEmptySelections.length === 0) {
    void vscode.window.showInformationMessage(text.selectCsvFirst);
    return;
  }

  const eastAsianCharacterWidth = resolveEastAsianCharacterWidth();

  const replacements = nonEmptySelections.map((selection) => {
    const originalText = editor.document.getText(selection);
    const aligned = alignDelimitedColumns(originalText, { eastAsianCharacterWidth });
    return {
      selection,
      originalText,
      aligned
    };
  });

  const applicableReplacements = replacements.filter(isApplicableReplacement);
  if (applicableReplacements.length === 0) {
    void vscode.window.showWarningMessage(text.noDelimiterDetected);
    return;
  }

  await editor.edit((editBuilder) => {
    for (const replacement of applicableReplacements) {
      editBuilder.replace(replacement.selection, replacement.aligned.alignedText);
    }
  });
}

function isApplicableReplacement(
  replacement: {
    readonly selection: vscode.Selection;
    readonly originalText: string;
    readonly aligned: ReturnType<typeof alignDelimitedColumns>;
  }
): replacement is {
  readonly selection: vscode.Selection;
  readonly originalText: string;
  readonly aligned: NonNullable<ReturnType<typeof alignDelimitedColumns>>;
} {
  return replacement.aligned !== undefined;
}

function resolveEastAsianCharacterWidth(): 1 | 2 {
  const configured = vscode.workspace
    .getConfiguration("memobox")
    .get<string>("csvAlignment.eastAsianWidth", "auto");

  if (configured === "1") {
    return 1;
  }
  if (configured === "2") {
    return 2;
  }

  // VS Code's editor always renders East Asian Wide characters as 2 cells
  // regardless of editor.fontFamily.
  return 2;
}

function getAlignCsvCommandText(language: "ja" | "en"): {
  readonly openEditorFirst: string;
  readonly selectCsvFirst: string;
  readonly noDelimiterDetected: string;
} {
  if (language === "ja") {
    return {
      openEditorFirst: "MemoBox: まずテキストエディタを開いてください。",
      selectCsvFirst: "MemoBox: CSV 列を揃える前に対象テキストを選択してください。",
      noDelimiterDetected: "MemoBox: 選択範囲から CSV らしい区切り文字を検出できませんでした。"
    };
  }

  return {
    openEditorFirst: "MemoBox: Open a text editor before aligning CSV columns.",
    selectCsvFirst: "MemoBox: Select CSV text before running Align Selected CSV Columns.",
    noDelimiterDetected: "MemoBox: No CSV-like delimiter was detected in the selected text."
  };
}
