import test from "node:test";
import assert from "node:assert/strict";
import { buildMemoTagSummaries, filterEntriesByTag } from "../src/core/memo/tags";

test("buildMemoTagSummaries counts tags across indexed memos", () => {
  const summaries = buildMemoTagSummaries([
    { tags: ["project-x", "review"] },
    { tags: ["project-x"] },
    { tags: ["infra"] }
  ] as never);

  assert.deepEqual(summaries, [
    { tag: "project-x", count: 2 },
    { tag: "infra", count: 1 },
    { tag: "review", count: 1 }
  ]);
});

test("filterEntriesByTag matches tags case-insensitively", () => {
  const filtered = filterEntriesByTag(
    [
      { relativePath: "a.md", tags: ["Project-X"] },
      { relativePath: "b.md", tags: ["infra"] }
    ],
    "project-x"
  );

  assert.deepEqual(filtered.map((entry) => entry.relativePath), ["a.md"]);
});
