import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { resolveMemoBoxAiConfigurationWithSecrets } from "../../infra/ai/configuration";

export interface ActiveMemoAiContext {
  readonly editor: vscode.TextEditor;
  readonly document: vscode.TextDocument;
}

export function getActiveMarkdownAiContext(): ActiveMemoAiContext | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage("MemoBox: Open a markdown memo first.");
    return undefined;
  }

  if (editor.document.languageId !== "markdown") {
    void vscode.window.showWarningMessage("MemoBox: AI commands are available only for Markdown documents.");
    return undefined;
  }

  return {
    editor,
    document: editor.document
  };
}

export async function ensureAiReady() {
  const settings = readSettings();
  if (!settings.aiEnabled) {
    void vscode.window.showWarningMessage("MemoBox: AI is disabled. Enable memobox.aiEnabled to use AI commands.");
    return undefined;
  }

  const resolved = await resolveMemoBoxAiConfigurationWithSecrets(settings);
  if (!resolved.configured || !resolved.profile) {
    void vscode.window.showWarningMessage(`MemoBox: ${resolved.issues[0] ?? "AI is not configured correctly."}`);
    return undefined;
  }

  return {
    settings,
    profile: resolved.profile,
    resolved
  };
}

export async function runAiWithProgress<T>(title: string, task: () => Promise<T>): Promise<T | undefined> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false
    },
    async () => {
      try {
        return await task();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`MemoBox: ${message}`);
        return undefined;
      }
    }
  );
}

export function parseJsonStringArray(rawText: string): readonly string[] {
  const match = rawText.match(/\[[\s\S]*?\]/u);
  if (!match) {
    return [];
  }

  try {
    const value = JSON.parse(match[0]) as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  } catch {
    return [];
  }
}
