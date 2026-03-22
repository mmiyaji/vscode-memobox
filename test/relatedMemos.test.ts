import test from "node:test";
import assert from "node:assert/strict";
import { findRelatedMemos } from "../src/core/memo/relatedMemos";

test("findRelatedMemos prioritizes shared tags and shared terms", () => {
  const results = findRelatedMemos(
    [
      {
        absolutePath: "/memo/2026/03/2026-03-22-project-review.md",
        relativePath: "2026/03/2026-03-22-project-review.md",
        birthtime: new Date("2026-03-22T00:00:00Z"),
        mtime: new Date("2026-03-22T00:00:00Z"),
        size: 10,
        title: "Project Review",
        tags: ["project-x", "review"]
      },
      {
        absolutePath: "/memo/2026/03/2026-03-20-project-notes.md",
        relativePath: "2026/03/2026-03-20-project-notes.md",
        birthtime: new Date("2026-03-20T00:00:00Z"),
        mtime: new Date("2026-03-20T00:00:00Z"),
        size: 10,
        title: "Project Notes",
        tags: ["project-x"]
      },
      {
        absolutePath: "/memo/2026/02/2026-02-01-infra.md",
        relativePath: "2026/02/2026-02-01-infra.md",
        birthtime: new Date("2026-02-01T00:00:00Z"),
        mtime: new Date("2026-02-01T00:00:00Z"),
        size: 10,
        title: "Infra",
        tags: ["infra"]
      }
    ],
    "/memo/2026/03/2026-03-22-project-review.md",
    5
  );

  assert.equal(results.length, 1);
  assert.equal(results[0]?.relativePath, "2026/03/2026-03-20-project-notes.md");
  assert.match(results[0]?.reasons.join(" | ") ?? "", /Shared tags/);
});
