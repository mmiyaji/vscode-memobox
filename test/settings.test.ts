import test from "node:test";
import assert from "node:assert/strict";

import {
  configurationSection,
  defaultDatePathFormat,
  defaultExcludeDirectories,
  defaultGrepViewMode,
  defaultListDisplayExtname,
  defaultListSortOrder,
  defaultMaxScanDepth,
  defaultMetaDir,
  extensionId
} from "../src/core/config/constants";

void test("core configuration constants are stable", () => {
  assert.equal(extensionId, "mmiyaji.vscode-memobox");
  assert.equal(configurationSection, "memobox");
  assert.equal(defaultMetaDir, ".vscode-memobox");
  assert.equal(defaultDatePathFormat, "yyyy/MM");
  assert.equal(defaultGrepViewMode, "quickPick");
  assert.equal(defaultListSortOrder, "filename");
  assert.deepEqual(defaultListDisplayExtname, ["md"]);
  assert.deepEqual(defaultExcludeDirectories, ["node_modules", "dist", "build", "out", "coverage", "vendor"]);
  assert.equal(defaultMaxScanDepth, 4);
});
