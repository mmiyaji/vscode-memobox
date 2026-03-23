import test from "node:test";
import assert from "node:assert/strict";
import { buildMemoLinkCandidates, buildRelativeMarkdownMemoLink, getMemoLinkLabel } from "../src/core/memo/memoLinks";

const baseEntries = [
  {
    absolutePath: "/memo/2026/03/2026-03-22-review.md",
    relativePath: "2026/03/2026-03-22-review.md",
    birthtime: new Date("2026-03-22T00:00:00Z"),
    mtime: new Date("2026-03-22T00:00:00Z"),
    size: 10,
    title: "Review",
    tags: ["project-x", "review"]
  },
  {
    absolutePath: "/memo/2026/03/2026-03-21-plan.md",
    relativePath: "2026/03/2026-03-21-plan.md",
    birthtime: new Date("2026-03-21T00:00:00Z"),
    mtime: new Date("2026-03-21T00:00:00Z"),
    size: 10,
    title: "Plan",
    tags: ["project-x"]
  },
  {
    absolutePath: "/memo/2026/03/2026-03-19-team-sync.md",
    relativePath: "2026/03/2026-03-19-team-sync.md",
    birthtime: new Date("2026-03-19T00:00:00Z"),
    mtime: new Date("2026-03-19T00:00:00Z"),
    size: 10,
    title: "Team Sync",
    tags: ["meeting"]
  }
] as const;

test("buildMemoLinkCandidates prioritizes query matches", () => {
  const candidates = buildMemoLinkCandidates(baseEntries, "/memo/2026/03/2026-03-22-review.md", {
    query: "plan"
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.absolutePath, "/memo/2026/03/2026-03-21-plan.md");
});

test("buildMemoLinkCandidates keeps close typo matches for longer queries", () => {
  const candidates = buildMemoLinkCandidates(
    [
      ...baseEntries,
      {
        absolutePath: "/memo/2026/03/2026-03-23-scaffold.md",
        relativePath: "2026/03/2026-03-23-scaffold.md",
        birthtime: new Date("2026-03-23T00:00:00Z"),
        mtime: new Date("2026-03-23T00:00:00Z"),
        size: 10,
        title: "scaffold",
        tags: ["inbox"]
      }
    ],
    "/memo/2026/03/2026-03-22-review.md",
    {
      query: "scaffi"
    }
  );

  assert.equal(candidates[0]?.absolutePath, "/memo/2026/03/2026-03-23-scaffold.md");
});

test("buildMemoLinkCandidates does not over-match short typos", () => {
  const candidates = buildMemoLinkCandidates(
    [
      ...baseEntries,
      {
        absolutePath: "/memo/2026/03/2026-03-23-scaffold.md",
        relativePath: "2026/03/2026-03-23-scaffold.md",
        birthtime: new Date("2026-03-23T00:00:00Z"),
        mtime: new Date("2026-03-23T00:00:00Z"),
        size: 10,
        title: "scaffold",
        tags: ["inbox"]
      }
    ],
    "/memo/2026/03/2026-03-22-review.md",
    {
      query: "saf"
    }
  );

  assert.equal(candidates.length, 0);
});

test("buildMemoLinkCandidates falls back to related memos when no query is provided", () => {
  const candidates = buildMemoLinkCandidates(baseEntries, "/memo/2026/03/2026-03-22-review.md");

  assert.equal(candidates[0]?.absolutePath, "/memo/2026/03/2026-03-21-plan.md");
});

test("buildRelativeMarkdownMemoLink creates a relative encoded markdown link", () => {
  const link = buildRelativeMarkdownMemoLink(
    "/memo/2026/03/2026-03-22-review.md",
    "/memo/2026/03/assets/My File [v2].png",
    "Reference [v2]"
  );

  assert.equal(link, "[Reference \\[v2\\]](assets/My%20File%20%5Bv2%5D.png)");
});

test("getMemoLinkLabel falls back to a cleaned file stem when no title exists", () => {
  const label = getMemoLinkLabel({
    relativePath: "2026/03/2026-03-18-team-sync.md"
  });

  assert.equal(label, "team sync");
});
