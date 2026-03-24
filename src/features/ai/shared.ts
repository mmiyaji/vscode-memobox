import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { defaultAiCostMode, defaultAiMonthlyLimitUsd, defaultAiPerRequestLimitUsd } from "../../core/config/constants";
import { MemoBoxAiError } from "../../infra/ai/client";
import { resolveMemoBoxAiConfigurationWithSecrets } from "../../infra/ai/configuration";
import { estimateAiCost, evaluateAiCostDecision, formatAiCostEstimate } from "../../infra/ai/costs";
import { recordAiUsage, readAiUsageMonthSummary } from "../../infra/ai/usageLedger";
import { logMemoBoxAiError, logMemoBoxAiInfo, logMemoBoxAiWarn } from "../../shared/logging";
export { parseJsonStringArray, unwrapAiTextResponse } from "./response";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";

export interface ActiveMemoAiContext {
  readonly editor: vscode.TextEditor;
  readonly document: vscode.TextDocument;
}

export interface ReadyMemoBoxAiContext {
  readonly settings: ReturnType<typeof readSettings>;
  readonly profile: NonNullable<Awaited<ReturnType<typeof resolveMemoBoxAiConfigurationWithSecrets>>["profile"]>;
  readonly resolved: NonNullable<Awaited<ReturnType<typeof resolveMemoBoxAiConfigurationWithSecrets>>>;
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
  } satisfies ReadyMemoBoxAiContext;
}

export async function runAiWithProgress<T>(
  title: string,
  // eslint-disable-next-line no-unused-vars
  task: (...args: [AbortSignal, vscode.Progress<{ message?: string; increment?: number }>]) => Promise<T>
): Promise<T | undefined> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true
    },
    async (progress, cancellationToken) => {
      const abortController = new AbortController();
      const subscription = cancellationToken.onCancellationRequested(() => {
        abortController.abort();
      });

      try {
        logMemoBoxAiInfo("command", "AI task started.", { title });
        const result = await task(abortController.signal, progress);
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

export async function runAiPromptWithGuards(
  title: string,
  ai: ReadyMemoBoxAiContext,
  prompt: string
): Promise<string | undefined> {
  const aiCostMode = ai.settings.aiCostMode ?? defaultAiCostMode;
  const aiPerRequestLimitUsd = ai.settings.aiPerRequestLimitUsd ?? defaultAiPerRequestLimitUsd;
  const aiMonthlyLimitUsd = ai.settings.aiMonthlyLimitUsd ?? defaultAiMonthlyLimitUsd;
  const preflightEstimate = estimateAiCost(ai.profile, prompt);
  const monthlyUsage = await readAiUsageMonthSummary(ai.settings);
  const costDecision = evaluateAiCostDecision(
    {
      mode: aiCostMode,
      perRequestLimitUsd: aiPerRequestLimitUsd,
      monthlyLimitUsd: aiMonthlyLimitUsd
    },
    preflightEstimate,
    monthlyUsage
  );

  if (aiCostMode === "estimateOnly" && preflightEstimate.hasPricing) {
    void vscode.window.showInformationMessage(`MemoBox: ${formatAiCostEstimate(preflightEstimate)}`);
  }

  if (costDecision.decision === "block") {
    logMemoBoxAiWarn("cost", "AI request blocked by cost guard.", {
      mode: aiCostMode,
      estimatedCostUsd: preflightEstimate.estimatedCostUsd
    });
    void vscode.window.showWarningMessage(costDecision.message);
    return undefined;
  }

  if (costDecision.decision === "confirm") {
    const confirmed = await vscode.window.showWarningMessage(
      `${costDecision.message} Continue?`,
      { modal: true },
      "Continue"
    );
    if (confirmed !== "Continue") {
      logMemoBoxAiInfo("cost", "AI request cancelled by user after cost confirmation.", {
        mode: aiCostMode,
        estimatedCostUsd: preflightEstimate.estimatedCostUsd
      });
      return undefined;
    }
  }

  const response = await runAiWithProgress(title, async (signal, progress) => {
    progress.report({ message: "Sending request..." });
    const result = await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
    progress.report({ message: "Processing response..." });
    return result;
  });

  if (!response) {
    return undefined;
  }

  const actualEstimate = estimateAiCost(ai.profile, prompt, response);
  const updatedUsage = await recordAiUsage(ai.settings, actualEstimate);
  logMemoBoxAiInfo("cost", "Recorded AI usage estimate.", {
    periodKey: updatedUsage.periodKey,
    estimatedCostUsd: Number(actualEstimate.estimatedCostUsd.toFixed(4)),
    monthlyEstimatedCostUsd: Number(updatedUsage.estimatedCostUsd.toFixed(4)),
    mode: aiCostMode
  });

  return response;
}
