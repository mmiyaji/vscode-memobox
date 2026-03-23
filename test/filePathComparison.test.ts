import test from "node:test";
import assert from "node:assert/strict";
import { areSameFilePath, normalizeFilePathForComparison } from "../src/shared/filePathComparison";

test("normalizeFilePathForComparison keeps a stable normalized representation", () => {
  const normalized = normalizeFilePathForComparison("C:/MemoBox/2026/03/../03/note.md");
  assert.ok(normalized.toLowerCase().includes("memobox"));
  assert.ok(normalized.endsWith("\\03\\note.md") || normalized.endsWith("/03/note.md"));
});

test("areSameFilePath compares Windows paths case-insensitively", { skip: process.platform !== "win32" }, () => {
  assert.equal(areSameFilePath("C:\\Users\\mail\\Documents\\MemoBox\\note.md", "c:\\users\\MAIL\\documents\\memobox\\note.md"), true);
});

test("areSameFilePath compares non-Windows paths exactly after normalization", { skip: process.platform === "win32" }, () => {
  assert.equal(areSameFilePath("/Users/mail/MemoBox/note.md", "/Users/mail/MemoBox/./note.md"), true);
  assert.equal(areSameFilePath("/Users/mail/MemoBox/note.md", "/users/mail/memobox/note.md"), false);
});
