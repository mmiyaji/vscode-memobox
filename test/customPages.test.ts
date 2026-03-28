import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import {
  buildCustomPageAllowedRoots,
  isAllowedCustomPageCommand,
  isAllowedCustomPageTargetPath
} from "../src/features/pages/customPageSecurity";

test("isAllowedCustomPageCommand only accepts whitelisted MemoBox commands", () => {
  assert.equal(isAllowedCustomPageCommand("memobox.newMemo"), true);
  assert.equal(isAllowedCustomPageCommand("memobox.refreshIndex"), true);
  assert.equal(isAllowedCustomPageCommand("memobox.aiSetApiKey"), false);
  assert.equal(isAllowedCustomPageCommand("workbench.action.openSettings"), false);
});

test("buildCustomPageAllowedRoots includes memo root, current page directory, and workspace page directories", () => {
  const roots = buildCustomPageAllowedRoots(
    { memodir: "C:/memo", metaDir: ".vscode-memobox" },
    "C:/memo/.vscode-memobox/pages/dashboard.html",
    ["C:/workspace/.vscode-memobox/pages"]
  );

  assert.deepEqual(roots, [
    normalize("C:/memo"),
    normalize("C:/memo/.vscode-memobox/pages"),
    normalize("C:/workspace/.vscode-memobox/pages")
  ]);
});

test("isAllowedCustomPageTargetPath only allows paths under configured roots", () => {
  const roots = [
    "C:/memo",
    "C:/memo/.vscode-memobox/pages"
  ];

  assert.equal(isAllowedCustomPageTargetPath("C:/memo/2026/03/2026-03-23.md", roots), true);
  assert.equal(isAllowedCustomPageTargetPath("C:/memo/.vscode-memobox/pages/dashboard.html", roots), true);
  assert.equal(isAllowedCustomPageTargetPath("C:/outside/secret.txt", roots), false);
});
