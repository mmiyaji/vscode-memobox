import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import { buildAdminAllowedRoots, isAllowedAdminTargetPath } from "../src/features/admin/adminSecurity";

test("buildAdminAllowedRoots includes memo, template, and snippet roots", () => {
  const roots = buildAdminAllowedRoots({
    memodir: "C:/memo",
    metaDir: ".vscode-memobox",
    templatesDir: "D:/shared/templates",
    snippetsDir: ""
  });

  assert.deepEqual(roots, [
    normalize("C:/memo"),
    normalize("D:/shared/templates"),
    normalize("C:/memo/.vscode-memobox/snippets")
  ]);
});

test("isAllowedAdminTargetPath only allows paths under admin roots", () => {
  const roots = [
    "C:/memo",
    "D:/shared/templates"
  ];

  assert.equal(isAllowedAdminTargetPath("C:/memo/2026/03/note.md", roots), true);
  assert.equal(isAllowedAdminTargetPath("D:/shared/templates/daily.md", roots), true);
  assert.equal(isAllowedAdminTargetPath("C:/memo", roots), true);
  assert.equal(isAllowedAdminTargetPath("C:/outside/secret.txt", roots), false);
});
