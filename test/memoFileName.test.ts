import test from "node:test";
import assert from "node:assert/strict";
import { buildMemoFileName, buildMemoTitleInput, sanitizeMemoTitle } from "../src/core/memo/fileName";

test("sanitizeMemoTitle replaces invalid filename characters", () => {
  assert.equal(sanitizeMemoTitle("hello / world?"), "hello-world");
});

test("buildMemoFileName uses the date when title is empty", () => {
  assert.equal(buildMemoFileName(new Date("2026-03-22T00:00:00Z"), ""), "2026-03-22.md");
});

test("buildMemoFileName appends a sanitized title", () => {
  assert.equal(
    buildMemoFileName(new Date("2026-03-22T00:00:00Z"), "Plan: review / ship"),
    "2026-03-22-Plan-review-ship.md"
  );
});

test("buildMemoTitleInput caps title length", () => {
  assert.equal(buildMemoTitleInput("x".repeat(80)).length, 49);
});
