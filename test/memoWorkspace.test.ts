import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import { buildMemoWorkspaceContent, getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../src/core/meta/memoWorkspace";

test("getMemoWorkspaceFilePath places the workspace file under the memo root", () => {
  assert.equal(
    getMemoWorkspaceFilePath("/memo/root", "MemoBox.code-workspace"),
    normalize("/memo/root/MemoBox.code-workspace")
  );
});

test("buildMemoWorkspaceContent writes memobox settings and recommendations", () => {
  const content = buildMemoWorkspaceContent({
    memodir: "/memo/root",
    metaDir: ".vscode-memobox",
    templatesDir: "",
    snippetsDir: ""
  });

  const parsed = JSON.parse(content) as {
    folders: Array<{ path: string; name: string }>;
    settings: Record<string, unknown>;
    extensions: { recommendations: string[] };
  };

  assert.equal(parsed.folders[0]?.name, "MemoBox");
  assert.equal(parsed.settings["memobox.adminOpenOnStartup"], true);
  assert.equal(parsed.settings["memobox.templatesDir"], normalize("/memo/root/.vscode-memobox/templates"));
  assert.equal(parsed.settings["memobox.snippetsDir"], normalize("/memo/root/.vscode-memobox/snippets"));
  assert.deepEqual(parsed.extensions.recommendations, [
    "mmiyaji.vscode-memobox",
    "yzhang.markdown-all-in-one"
  ]);
});

test("getDefaultWorkspaceName uses the memo root folder name", () => {
  assert.equal(getDefaultWorkspaceName(), "MemoBox");
});
