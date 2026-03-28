import test from "node:test";
import assert from "node:assert/strict";

import { findExactMemoByWikiLabel, detectWikiLinkAtPosition } from "../src/core/memo/wikilinks";

const entries = [
  {
    absolutePath: "/memo/2026/03/2026-03-22-review.md",
    relativePath: "2026/03/2026-03-22-review.md",
    birthtime: new Date("2026-03-22T00:00:00Z"),
    mtime: new Date("2026-03-22T00:00:00Z"),
    size: 10,
    title: "Review",
    tags: ["review"]
  },
  {
    absolutePath: "/memo/2026/03/2026-03-23-scaffold.md",
    relativePath: "2026/03/2026-03-23-scaffold.md",
    birthtime: new Date("2026-03-23T00:00:00Z"),
    mtime: new Date("2026-03-23T00:00:00Z"),
    size: 10,
    title: "scaffold",
    tags: ["inbox"]
  }
] as const;

test("detectWikiLinkAtPosition finds the wiki link around the cursor", () => {
  const result = detectWikiLinkAtPosition("see [[scaffold]] later", 9);
  assert.deepEqual(result, {
    query: "scaffold",
    startCharacter: 4,
    endCharacter: 16
  });
});

test("findExactMemoByWikiLabel resolves exact title matches case-insensitively", () => {
  const result = findExactMemoByWikiLabel(entries, "/memo/2026/03/current.md", "Scaffold");
  assert.equal(result?.absolutePath, "/memo/2026/03/2026-03-23-scaffold.md");
});
