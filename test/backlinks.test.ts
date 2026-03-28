import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { findMemoBacklinks } from "../src/core/memo/backlinks";

test("findMemoBacklinks finds markdown links that point to the target memo", async () => {
  const root = await mkdtemp(join(tmpdir(), "memobox-backlinks-"));
  const targetPath = join(root, "2026-03-23-target.md");
  const sourcePath = join(root, "2026-03-22-source.md");
  await mkdir(root, { recursive: true });
  await writeFile(targetPath, "# Target\n", "utf8");
  await writeFile(sourcePath, "[Target](2026-03-23-target.md)\n", "utf8");

  const matches = await findMemoBacklinks(
    [
      {
        absolutePath: targetPath,
        relativePath: "2026-03-23-target.md",
        birthtime: new Date("2026-03-23T00:00:00Z"),
        mtime: new Date("2026-03-23T00:00:00Z"),
        size: 10,
        title: "Target",
        tags: []
      },
      {
        absolutePath: sourcePath,
        relativePath: "2026-03-22-source.md",
        birthtime: new Date("2026-03-22T00:00:00Z"),
        mtime: new Date("2026-03-22T00:00:00Z"),
        size: 10,
        title: "Source",
        tags: []
      }
    ],
    targetPath
  );

  assert.equal(matches.length, 1);
  assert.equal(matches[0]?.sourcePath, sourcePath);
  assert.equal(matches[0]?.line, 1);
});

test("findMemoBacklinks skips source entries that can no longer be read", async () => {
  const root = await mkdtemp(join(tmpdir(), "memobox-backlinks-missing-"));
  const targetPath = join(root, "2026-03-23-target.md");
  const missingSourcePath = join(root, "2026-03-22-missing.md");
  await mkdir(root, { recursive: true });
  await writeFile(targetPath, "# Target\n", "utf8");

  const matches = await findMemoBacklinks(
    [
      {
        absolutePath: targetPath,
        relativePath: "2026-03-23-target.md",
        birthtime: new Date("2026-03-23T00:00:00Z"),
        mtime: new Date("2026-03-23T00:00:00Z"),
        size: 10,
        title: "Target",
        tags: []
      },
      {
        absolutePath: missingSourcePath,
        relativePath: "2026-03-22-missing.md",
        birthtime: new Date("2026-03-22T00:00:00Z"),
        mtime: new Date("2026-03-22T00:00:00Z"),
        size: 10,
        title: "Missing",
        tags: []
      }
    ],
    targetPath
  );

  assert.deepEqual(matches, []);
});
