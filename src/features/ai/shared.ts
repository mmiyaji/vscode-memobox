import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { MemoBoxAiError } from "../../infra/ai/client";
import { resolveMemoBoxAiConfigurationWithSecrets } from "../../infra/ai/configuration";
import { logMemoBoxAiError, logMemoBoxAiInfo, logMemoBoxAiWarn } from "../../shared/logging";
export { parseJsonStringArray, unwrapAiTextResponse } from "./response";

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
    logMemoBoxAiWarn("command", "AI command rejected because AI is disabled.");
    void vscode.window.showWarningMessage("MemoBox: AI is disabled. Enable memobox.aiEnabled to use AI commands.");
    return undefined;
  }

  const resolved = await resolveMemoBoxAiConfigurationWithSecrets(settings);
  if (!resolved.configured || !resolved.profile) {
    logMemoBoxAiWarn("command", "AI command rejected because configuration is incomplete.", {
      issue: resolved.issues[0] ?? "unknown"
    });
    void vscode.window.showWarningMessage(`MemoBox: ${resolved.issues[0] ?? "AI is not configured correctly."}`);
    return undefined;
  }

  return {
    settings,
    profile: resolved.profile,
    resolved
  };
}

export async function runAiWithProgress<T>(
  title: string,
  // eslint-disable-next-line no-unused-vars
  task: (...args: [AbortSignal]) => Promise<T>
): Promise<T | undefined> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true
    },
    async (_, cancellationToken) => {
      const abortController = new AbortController();
      const subscription = cancellationToken.onCancellationRequested(() => {
        abortController.abort();
      });

      try {
        logMemoBoxAiInfo("command", "AI task started.", { title });
        const result = await task(abortController.signal);
        logMemoBoxAiInfo("command", "AI task completed.", { title });
        return result;
      } catch (error) {
        if (error instanceof MemoBoxAiError && error.code === "cancelled") {
          logMemoBoxAiInfo("command", "AI task cancelled.", { title });
          return undefined;
        }

        const message = error instanceof Error ? error.message : String(error);
        logMemoBoxAiError("command", "AI task failed.", { title, message });
        void vscode.window.showErrorMessage(`MemoBox: ${message}`);
        return undefined;
      } finally {
        subscription.dispose();
      }
    }
  );
}
