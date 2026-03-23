import * as vscode from "vscode";
import { detectMemoLinkCompletionContext, shouldTriggerMemoLinkSuggest } from "./memoLinkCompletion";
import { logMemoBoxInfo } from "../../shared/logging";

export class MemoLinkSuggestTrigger implements vscode.Disposable {
  private readonly subscription: vscode.Disposable;

  constructor() {
    this.subscription = vscode.workspace.onDidChangeTextDocument((event) => {
      void this.handleDidChangeTextDocument(event);
    });
  }

  dispose(): void {
    this.subscription.dispose();
  }

  private async handleDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document || event.document.languageId !== "markdown") {
      return;
    }

    if (event.contentChanges.length !== 1) {
      return;
    }

    const change = event.contentChanges[0];
    if (!change || !shouldTriggerMemoLinkSuggest(change.text)) {
      return;
    }

    const cursor = editor.selection.active;
    const linePrefix = event.document.lineAt(cursor.line).text.slice(0, cursor.character);
    if (!detectMemoLinkCompletionContext(linePrefix)) {
      return;
    }

    logMemoBoxInfo("links", "Auto-triggering memo link suggestions.", {
      filePath: event.document.uri.fsPath,
      insertedText: change.text,
      linePrefix
    });
    await vscode.commands.executeCommand("editor.action.triggerSuggest");
  }
}
