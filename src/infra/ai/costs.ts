import { Buffer } from "node:buffer";
import { defaultAiEstimatedOutputTokens } from "../../core/config/constants";
import type { MemoBoxAiCostMode, MemoBoxAiProfileSettings } from "../../core/config/types";

export interface MemoBoxAiCostEstimate {
  readonly promptTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly estimatedCostUsd: number;
  readonly hasPricing: boolean;
}

export interface MemoBoxAiCostThresholds {
  readonly mode: MemoBoxAiCostMode;
  readonly perRequestLimitUsd: number;
  readonly monthlyLimitUsd: number;
}

export interface MemoBoxAiMonthlyUsageSummary {
  readonly estimatedCostUsd: number;
  readonly requests: number;
}

export type MemoBoxAiCostDecision =
  | { readonly decision: "allow"; readonly message?: string }
  | { readonly decision: "confirm"; readonly message: string }
  | { readonly decision: "block"; readonly message: string };

export function estimateAiCost(
  profile: Pick<MemoBoxAiProfileSettings, "inputCostPer1kUsd" | "outputCostPer1kUsd" | "estimatedOutputTokens">,
  prompt: string,
  responseText = ""
): MemoBoxAiCostEstimate {
  const inputCostPer1kUsd = profile.inputCostPer1kUsd ?? 0;
  const outputCostPer1kUsd = profile.outputCostPer1kUsd ?? 0;
  const estimatedOutputTokens = profile.estimatedOutputTokens ?? defaultAiEstimatedOutputTokens;
  const promptTokens = estimateTextTokens(prompt);
  const outputTokens = responseText.trim() === ""
    ? Math.max(0, estimatedOutputTokens)
    : estimateTextTokens(responseText);
  const totalTokens = promptTokens + outputTokens;
  const hasPricing = inputCostPer1kUsd > 0 || outputCostPer1kUsd > 0;
  const estimatedCostUsd = hasPricing
    ? ((promptTokens / 1000) * inputCostPer1kUsd) + ((outputTokens / 1000) * outputCostPer1kUsd)
    : 0;

  return {
    promptTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
    hasPricing
  };
}

export function evaluateAiCostDecision(
  thresholds: MemoBoxAiCostThresholds,
  estimate: MemoBoxAiCostEstimate,
  monthlyUsage: MemoBoxAiMonthlyUsageSummary
): MemoBoxAiCostDecision {
  if (thresholds.mode === "off" || thresholds.mode === "estimateOnly" || !estimate.hasPricing) {
    return { decision: "allow" };
  }

  const nextMonthlyCost = monthlyUsage.estimatedCostUsd + estimate.estimatedCostUsd;
  const requestExceeded = thresholds.perRequestLimitUsd > 0 && estimate.estimatedCostUsd > thresholds.perRequestLimitUsd;
  const monthlyExceeded = thresholds.monthlyLimitUsd > 0 && nextMonthlyCost > thresholds.monthlyLimitUsd;
  if (!requestExceeded && !monthlyExceeded) {
    return { decision: "allow" };
  }

  const reasons: string[] = [];
  if (requestExceeded) {
    reasons.push(`estimated request cost ${formatUsd(estimate.estimatedCostUsd)} exceeds limit ${formatUsd(thresholds.perRequestLimitUsd)}`);
  }
  if (monthlyExceeded) {
    reasons.push(`estimated monthly total ${formatUsd(nextMonthlyCost)} exceeds limit ${formatUsd(thresholds.monthlyLimitUsd)}`);
  }

  const message = `MemoBox: AI cost guard triggered because ${reasons.join(" and ")}.`;
  if (thresholds.mode === "confirmHighCost" || thresholds.mode === "softCap") {
    return {
      decision: "confirm",
      message
    };
  }

  return {
    decision: "block",
    message
  };
}

export function formatAiCostEstimate(estimate: MemoBoxAiCostEstimate): string {
  const costLabel = estimate.hasPricing ? formatUsd(estimate.estimatedCostUsd) : "n/a";
  return `Estimated cost ${costLabel} (${estimate.promptTokens} in / ${estimate.outputTokens} out tokens)`;
}

export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) {
    return "<$0.01";
  }

  return `$${value.toFixed(2)}`;
}

function estimateTextTokens(text: string): number {
  if (text.trim() === "") {
    return 0;
  }

  return Math.max(1, Math.ceil(Buffer.byteLength(text, "utf8") / 4));
}
