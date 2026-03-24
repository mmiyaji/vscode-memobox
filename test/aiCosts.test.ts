import test from "node:test";
import assert from "node:assert/strict";
import { estimateAiCost, evaluateAiCostDecision, formatAiCostEstimate } from "../src/infra/ai/costs";

test("estimateAiCost derives token counts and cost from profile pricing", () => {
  const estimate = estimateAiCost(
    {
      inputCostPer1kUsd: 0.01,
      outputCostPer1kUsd: 0.02,
      estimatedOutputTokens: 800
    },
    "hello world",
    "response"
  );

  assert.equal(estimate.hasPricing, true);
  assert.ok(estimate.promptTokens > 0);
  assert.ok(estimate.outputTokens > 0);
  assert.ok(estimate.estimatedCostUsd > 0);
});

test("evaluateAiCostDecision blocks or confirms when thresholds are exceeded", () => {
  const estimate = {
    promptTokens: 1000,
    outputTokens: 1000,
    totalTokens: 2000,
    estimatedCostUsd: 1.5,
    hasPricing: true
  } as const;

  const confirmDecision = evaluateAiCostDecision(
    {
      mode: "confirmHighCost",
      perRequestLimitUsd: 1,
      monthlyLimitUsd: 0
    },
    estimate,
    {
      estimatedCostUsd: 0,
      requests: 0
    }
  );
  assert.equal(confirmDecision.decision, "confirm");

  const hardDecision = evaluateAiCostDecision(
    {
      mode: "hardCap",
      perRequestLimitUsd: 0,
      monthlyLimitUsd: 1
    },
    estimate,
    {
      estimatedCostUsd: 0.8,
      requests: 2
    }
  );
  assert.equal(hardDecision.decision, "block");
});

test("formatAiCostEstimate includes cost and token counts", () => {
  assert.match(
    formatAiCostEstimate({
      promptTokens: 120,
      outputTokens: 80,
      totalTokens: 200,
      estimatedCostUsd: 0.004,
      hasPricing: true
    }),
    /Estimated cost/
  );
});
