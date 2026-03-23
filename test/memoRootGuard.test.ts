import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { homedir } from "node:os";
import { assessMemoRootScope } from "../src/core/memo/memoRootGuard";

test("assessMemoRootScope flags high-level folders", () => {
  const homePath = homedir();
  const documentsPath = join(homePath, "Documents");

  assert.equal(assessMemoRootScope(homePath).isSuspicious, true);
  assert.equal(assessMemoRootScope(documentsPath).isSuspicious, true);
});

test("assessMemoRootScope accepts a dedicated child memo directory", () => {
  const memoPath = join(homedir(), "Documents", "MemoBox");
  const assessment = assessMemoRootScope(memoPath);

  assert.equal(assessment.isSuspicious, false);
  assert.deepEqual(assessment.riskCodes, []);
});
