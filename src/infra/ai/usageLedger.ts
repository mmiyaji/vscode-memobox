import { mkdir, readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import type { MemoBoxSettings } from "../../core/config/types";
import { writeFileSafely } from "../../shared/safeWrite";
import type { MemoBoxAiCostEstimate } from "./costs";

interface MemoBoxAiUsageLedgerMonth {
  estimatedCostUsd: number;
  requests: number;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  updatedAt: string;
}

interface MemoBoxAiUsageLedger {
  months: Record<string, MemoBoxAiUsageLedgerMonth>;
}

const emptyLedger: MemoBoxAiUsageLedger = { months: {} };

export interface MemoBoxAiUsageMonthSummary {
  readonly periodKey: string;
  readonly estimatedCostUsd: number;
  readonly requests: number;
  readonly promptTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
}

export function getAiUsageLedgerFilePath(settings: Pick<MemoBoxSettings, "memodir" | "metaDir">): string {
  return normalize(join(settings.memodir, settings.metaDir, "ai-usage.json"));
}

export async function readAiUsageMonthSummary(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  now: Date = new Date()
): Promise<MemoBoxAiUsageMonthSummary> {
  const ledger = await readAiUsageLedger(settings);
  const periodKey = formatUsageMonthKey(now);
  const month = ledger.months[periodKey];

  return {
    periodKey,
    estimatedCostUsd: month?.estimatedCostUsd ?? 0,
    requests: month?.requests ?? 0,
    promptTokens: month?.promptTokens ?? 0,
    outputTokens: month?.outputTokens ?? 0,
    totalTokens: month?.totalTokens ?? 0
  };
}

export async function recordAiUsage(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  estimate: MemoBoxAiCostEstimate,
  now: Date = new Date()
): Promise<MemoBoxAiUsageMonthSummary> {
  const ledger = await readAiUsageLedger(settings);
  const periodKey = formatUsageMonthKey(now);
  const current = ledger.months[periodKey] ?? {
    estimatedCostUsd: 0,
    requests: 0,
    promptTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    updatedAt: now.toISOString()
  };
  const next: MemoBoxAiUsageLedgerMonth = {
    estimatedCostUsd: current.estimatedCostUsd + estimate.estimatedCostUsd,
    requests: current.requests + 1,
    promptTokens: current.promptTokens + estimate.promptTokens,
    outputTokens: current.outputTokens + estimate.outputTokens,
    totalTokens: current.totalTokens + estimate.totalTokens,
    updatedAt: now.toISOString()
  };

  ledger.months[periodKey] = next;

  const ledgerFilePath = getAiUsageLedgerFilePath(settings);
  await mkdir(normalize(join(settings.memodir, settings.metaDir)), { recursive: true });
  await writeFileSafely(ledgerFilePath, `${JSON.stringify(ledger, null, 2)}\n`);

  return {
    periodKey,
    estimatedCostUsd: next.estimatedCostUsd,
    requests: next.requests,
    promptTokens: next.promptTokens,
    outputTokens: next.outputTokens,
    totalTokens: next.totalTokens
  };
}

async function readAiUsageLedger(settings: Pick<MemoBoxSettings, "memodir" | "metaDir">): Promise<MemoBoxAiUsageLedger> {
  try {
    const raw = await readFile(getAiUsageLedgerFilePath(settings), "utf8");
    const parsed = JSON.parse(raw) as Partial<MemoBoxAiUsageLedger>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.months !== "object" || parsed.months === null) {
      return { ...emptyLedger };
    }

    return {
      months: Object.fromEntries(
        Object.entries(parsed.months).flatMap(([key, value]) => {
          if (!isLedgerMonth(value)) {
            return [];
          }

          return [[key, value] as const];
        })
      )
    };
  } catch {
    return { ...emptyLedger };
  }
}

function formatUsageMonthKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isLedgerMonth(value: unknown): value is MemoBoxAiUsageLedgerMonth {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isNonNegativeNumber(record.estimatedCostUsd)
    && isNonNegativeNumber(record.requests)
    && isNonNegativeNumber(record.promptTokens)
    && isNonNegativeNumber(record.outputTokens)
    && isNonNegativeNumber(record.totalTokens)
    && typeof record.updatedAt === "string";
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
