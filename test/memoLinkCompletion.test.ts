import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMemoLinkCompletionText,
  detectMemoLinkCompletionContext,
  shouldTriggerMemoLinkSuggest
} from "../src/features/links/memoLinkCompletion";

test("detectMemoLinkCompletionContext detects wiki-like memo link input", () => {
  const context = detectMemoLinkCompletionContext("See also [[pla");

  assert.deepEqual(context, {
    kind: "wikilinkLike",
    query: "pla",
    replaceStartCharacter: 9
  });
});

test("detectMemoLinkCompletionContext detects closed wiki-like memo link input", () => {
  const context = detectMemoLinkCompletionContext("[[scaffold]]");

  assert.deepEqual(context, {
    kind: "wikilinkLike",
    query: "scaffold",
    replaceStartCharacter: 0
  });
});

test("detectMemoLinkCompletionContext detects markdown target input", () => {
  const context = detectMemoLinkCompletionContext("[Plan](");

  assert.deepEqual(context, {
    kind: "markdownTarget",
    query: "",
    replaceStartCharacter: 7
  });
});

test("buildMemoLinkCompletionText expands wiki-like input into a full markdown link", () => {
  const text = buildMemoLinkCompletionText(
    {
      kind: "wikilinkLike",
      query: "pla",
      replaceStartCharacter: 0
    },
    "/memo/2026/03/2026-03-22-review.md",
    "/memo/2026/03/2026-03-21-plan.md",
    "Plan"
  );

  assert.equal(text, "[Plan](2026-03-21-plan.md)");
});

test("buildMemoLinkCompletionText inserts only the relative target for markdown links", () => {
  const text = buildMemoLinkCompletionText(
    {
      kind: "markdownTarget",
      query: "",
      replaceStartCharacter: 0
    },
    "/memo/2026/03/2026-03-22-review.md",
    "/memo/2026/03/2026-03-21-plan.md",
    "Plan"
  );

  assert.equal(text, "2026-03-21-plan.md");
});

test("shouldTriggerMemoLinkSuggest reacts to link-oriented single-character input", () => {
  assert.equal(shouldTriggerMemoLinkSuggest("["), true);
  assert.equal(shouldTriggerMemoLinkSuggest("]"), true);
  assert.equal(shouldTriggerMemoLinkSuggest("("), true);
  assert.equal(shouldTriggerMemoLinkSuggest("p"), true);
  assert.equal(shouldTriggerMemoLinkSuggest("/"), true);
  assert.equal(shouldTriggerMemoLinkSuggest("ab"), false);
  assert.equal(shouldTriggerMemoLinkSuggest(" "), false);
});
