import * as vscode from "vscode";
import { buildFootnoteInsertion } from "../../core/text/footnotes";

export async function insertFootnoteCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const { reference, definitionBlock } = buildFootnoteInsertion(editor.document.getText());
  const insertionPosition = editor.selection.active;
  const documentEnd = editor.document.positionAt(editor.document.getText().length);

  await editor.edit((editBuilder) => {
    editBuilder.insert(insertionPosition, reference);
    editBuilder.insert(documentEnd, definitionBlock);
  });

  const definitionStart = editor.document.positionAt(editor.document.getText().length);
  editor.selection = new vscode.Selection(definitionStart, definitionStart);
}
