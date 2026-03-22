import test from "node:test";
import assert from "node:assert/strict";
import { extractMemoFrontmatterMetadata } from "../src/core/memo/frontmatter";

test("extractMemoFrontmatterMetadata reads scalar title and inline tags", () => {
  const metadata = extractMemoFrontmatterMetadata(`---\ntitle: "Weekly Review"\ntags: [project-x, review]\n---\n\nBody`);

  assert.equal(metadata.title, "Weekly Review");
  assert.deepEqual(metadata.tags, ["project-x", "review"]);
});

test("extractMemoFrontmatterMetadata reads list-style tags and ignores missing frontmatter", () => {
  const metadata = extractMemoFrontmatterMetadata(`---\ntags:\n  - alpha\n  - beta\n---\nHello`);
  assert.deepEqual(metadata.tags, ["alpha", "beta"]);

  assert.deepEqual(extractMemoFrontmatterMetadata("No frontmatter"), { tags: [] });
});
