import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import { buildRedatedMemoPath, isPathInsideMemoRoot } from "../src/core/memo/redateMemo";

test("buildRedatedMemoPath updates the leading date and keeps the title suffix", () => {
  assert.equal(
    buildRedatedMemoPath("C:/memo/2026/03/2026-03-20-ship-plan.md", new Date("2026-03-22T00:00:00Z")),
    normalize("C:/memo/2026/03/2026-03-22-ship-plan.md")
  );
});

test("buildRedatedMemoPath returns undefined for date-only files", () => {
  assert.equal(buildRedatedMemoPath("C:/memo/2026/03/2026-03-20.md", new Date("2026-03-22T00:00:00Z")), undefined);
});

test("buildRedatedMemoPath returns undefined when the file name does not start with a date", () => {
  assert.equal(buildRedatedMemoPath("C:/memo/2026/03/ship-plan.md", new Date("2026-03-22T00:00:00Z")), undefined);
});

test("isPathInsideMemoRoot accepts descendants and rejects the root itself", () => {
  assert.equal(isPathInsideMemoRoot("C:/memo", "C:/memo/2026/03/2026-03-20-ship-plan.md"), true);
  assert.equal(isPathInsideMemoRoot("C:/memo", "C:/memo"), false);
  assert.equal(isPathInsideMemoRoot("C:/memo", "C:/other/2026-03-20-ship-plan.md"), false);
});
