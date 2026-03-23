import test from "node:test";
import assert from "node:assert/strict";
import { parseLinkSuggestions, resolveReportStartDate } from "../src/features/ai/support";

test("parseLinkSuggestions reads JSON suggestions safely", () => {
  const suggestions = parseLinkSuggestions(
    'prefix [{"keyword":"design note","memo_index":2,"reason":"mentions the same topic"}] suffix'
  );

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.keyword, "design note");
  assert.equal(suggestions[0]?.memo_index, 2);
});

test("resolveReportStartDate expands common report ranges", () => {
  const now = new Date("2026-03-23T12:00:00Z");

  assert.equal(formatLocalDate(resolveReportStartDate("today", now)), "2026-03-23");
  assert.equal(formatLocalDate(resolveReportStartDate("3days", now)), "2026-03-21");
  assert.equal(formatLocalDate(resolveReportStartDate("7days", now)), "2026-03-17");
});

function formatLocalDate(value: Date): string {
  const year = String(value.getFullYear());
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
