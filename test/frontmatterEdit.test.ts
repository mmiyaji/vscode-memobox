import test from "node:test";
import assert from "node:assert/strict";
import { setFrontmatterScalar, setFrontmatterStringList, updateFirstHeading } from "../src/core/memo/frontmatterEdit";

test("setFrontmatterScalar creates frontmatter when absent", () => {
  const updated = setFrontmatterScalar("# Hello\n", "title", "Plan");
  assert.equal(updated, "---\ntitle: 'Plan'\n---\n# Hello\n");
});

test("setFrontmatterStringList replaces an existing list field", () => {
  const updated = setFrontmatterStringList("---\ntitle: 'Plan'\ntags:\n  - old\n---\n# Hello\n", "tags", ["alpha", "project-x"]);
  assert.equal(updated, "---\ntitle: 'Plan'\ntags:\n  - alpha\n  - project-x\n---\n# Hello\n");
});

test("updateFirstHeading rewrites the existing h1", () => {
  const updated = updateFirstHeading("---\ntitle: 'Plan'\n---\n# Old title\n\nBody\n", "New title");
  assert.equal(updated, "---\ntitle: 'Plan'\n---\n# New title\n\nBody\n");
});
