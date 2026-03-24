import * as vscode from "vscode";
import { defaultMemoLinkSuggestDebounceMs } from "../../core/config/constants";
import { detectMemoLinkCompletionContext, shouldTriggerMemoLinkSuggest } from "./memoLinkCompletion";
import { logMemoBoxInfo } from "../../shared/logging";

export class MemoLinkSuggestTrigger implements vscode.Disposable {
  private readonly subscription: vscode.Disposable;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.subscription = vscode.workspace.onDidChangeTextDocument((event) => {
      void this.handleDidChangeTextDocument(event);
    });
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
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

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      logMemoBoxInfo("links", "Auto-triggering memo link suggestions.", {
        filePath: event.document.uri.fsPath,
        insertedText: change.text,
        linePrefix
      });
      void vscode.commands.executeCommand("editor.action.triggerSuggest");
    }, defaultMemoLinkSuggestDebounceMs);
  }
}
