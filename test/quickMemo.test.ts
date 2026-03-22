import test from "node:test";
import assert from "node:assert/strict";
import { buildQuickMemoAppendText, buildQuickMemoInitialContent } from "../src/core/memo/quickMemo";

test("buildQuickMemoInitialContent creates the daily heading", () => {
  assert.equal(
    buildQuickMemoInitialContent(new Date(2026, 2, 22), "yyyy-MM-dd"),
    "# 2026-03-22\n\n"
  );
});

test("buildQuickMemoAppendText adds a timestamp heading with selected text", () => {
  assert.equal(
    buildQuickMemoAppendText({
      currentContent: "# 2026-03-22\n\n",
      date: new Date(2026, 2, 22, 1, 2),
      selectedText: "Ship review",
      titlePrefix: "## ",
      dateFormat: "yyyy-MM-dd HH:mm"
    }),
    "\n## 2026-03-22 01:02 Ship review\n\n"
  );
});

test("buildQuickMemoAppendText works for empty files", () => {
  assert.equal(
    buildQuickMemoAppendText({
      currentContent: "",
      date: new Date(2026, 2, 22, 1, 2),
      selectedText: "",
      titlePrefix: "## ",
      dateFormat: "yyyy-MM-dd HH:mm"
    }),
    "## 2026-03-22 01:02\n\n"
  );
});
