import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAiUsageMonthSummary, recordAiUsage } from "../src/infra/ai/usageLedger";

test("recordAiUsage persists monthly usage totals", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-ai-usage-"));
  const settings = {
    memodir,
    metaDir: ".vscode-memobox"
  };

  const first = await recordAiUsage(
    settings,
    {
      promptTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      estimatedCostUsd: 0.25,
      hasPricing: true
    },
    new Date("2026-03-24T12:00:00Z")
  );
  assert.equal(first.requests, 1);
  assert.equal(first.estimatedCostUsd, 0.25);

  const second = await recordAiUsage(
    settings,
    {
      promptTokens: 60,
      outputTokens: 40,
      totalTokens: 100,
      estimatedCostUsd: 0.1,
      hasPricing: true
    },
    new Date("2026-03-24T12:10:00Z")
  );
  assert.equal(second.requests, 2);
  assert.equal(second.estimatedCostUsd, 0.35);

  const summary = await readAiUsageMonthSummary(settings, new Date("2026-03-25T00:00:00Z"));
  assert.equal(summary.requests, 2);
  assert.equal(summary.totalTokens, 250);
  assert.equal(summary.estimatedCostUsd, 0.35);
});
