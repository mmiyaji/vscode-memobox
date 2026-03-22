import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminFolderCounts, buildAdminRecentFiles, buildPinnedAdminFiles } from "../src/features/admin/adminViewModel";

test("buildAdminRecentFiles sorts by latest update and limits the result", () => {
  const rows = buildAdminRecentFiles(
    [
      {
        absolutePath: "/memo/a.md",
        relativePath: "2026/03/a.md",
        birthtime: new Date("2026-03-20T00:00:00Z"),
        mtime: new Date("2026-03-20T01:00:00Z"),
        size: 10,
        tags: []
      },
      {
        absolutePath: "/memo/b.md",
        relativePath: "2026/03/b.md",
        birthtime: new Date("2026-03-21T00:00:00Z"),
        mtime: new Date("2026-03-21T01:00:00Z"),
        size: 10,
        tags: []
      }
    ],
    [],
    1
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.relativePath, "2026/03/b.md");
  assert.equal(rows[0]?.isPinned, false);
});

test("buildAdminRecentFiles respects the provided limit", () => {
  const rows = buildAdminRecentFiles(
    [
      {
        absolutePath: "/memo/a.md",
        relativePath: "2026/03/a.md",
        birthtime: new Date("2026-03-20T00:00:00Z"),
        mtime: new Date("2026-03-20T01:00:00Z"),
        size: 10,
        tags: []
      },
      {
        absolutePath: "/memo/b.md",
        relativePath: "2026/03/b.md",
        birthtime: new Date("2026-03-21T00:00:00Z"),
        mtime: new Date("2026-03-21T01:00:00Z"),
        size: 10,
        tags: []
      }
    ],
    [],
    2
  );

  assert.equal(rows.length, 2);
});

test("buildAdminFolderCounts groups files by parent folder", () => {
  const rows = buildAdminFolderCounts([
    { relativePath: "2026/03/a.md" },
    { relativePath: "2026/03/b.md" },
    { relativePath: "2026/04/c.md" }
  ] as never);

  assert.deepEqual(rows, [
    { label: "2026/03", count: 2 },
    { label: "2026/04", count: 1 }
  ]);
});

test("buildPinnedAdminFiles keeps stored order and marks items as pinned", () => {
  const rows = buildPinnedAdminFiles(
    [
      {
        absolutePath: "/memo/a.md",
        relativePath: "2026/03/a.md",
        birthtime: new Date("2026-03-20T00:00:00Z"),
        mtime: new Date("2026-03-20T01:00:00Z"),
        size: 10,
        tags: []
      },
      {
        absolutePath: "/memo/b.md",
        relativePath: "2026/03/b.md",
        birthtime: new Date("2026-03-21T00:00:00Z"),
        mtime: new Date("2026-03-21T01:00:00Z"),
        size: 10,
        tags: []
      }
    ],
    ["2026/03/b.md", "2026/03/a.md"]
  );

  assert.deepEqual(
    rows.map((row) => ({ relativePath: row.relativePath, isPinned: row.isPinned })),
    [
      { relativePath: "2026/03/b.md", isPinned: true },
      { relativePath: "2026/03/a.md", isPinned: true }
    ]
  );
});
