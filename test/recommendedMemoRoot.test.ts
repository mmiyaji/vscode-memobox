import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import { getRecommendedMemoRoot } from "../src/features/welcome/recommendedMemoRoot";

test("getRecommendedMemoRoot uses Documents/MemoBox under the home directory", () => {
  assert.equal(getRecommendedMemoRoot("/users/tester"), normalize("/users/tester/Documents/MemoBox"));
});
