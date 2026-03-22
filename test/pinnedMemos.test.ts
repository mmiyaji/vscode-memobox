import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import {
  getPinnedMemosFilePath,
  pinMemoByAbsolutePath,
  readPinnedMemoRelativePaths,
  unpinMemoByAbsolutePath
} from "../src/core/meta/pinnedMemos";

function createSettings(memodir: string): MemoBoxSettings {
  return {
    memodir,
    datePathFormat: "yyyy/MM",
    memotemplate: "",
    metaDir: ".vscode-memobox",
    templatesDir: "",
    snippetsDir: "",
    searchMaxResults: 200,
    relatedMemoLimit: 12,
    listSortOrder: "filename",
    listDisplayExtname: ["md"],
    displayFileBirthTime: false,
    openMarkdownPreview: false,
    grepViewMode: "quickPick",
    todoPattern: "^.*@todo.*?:",
    recentCount: 8,
    adminOpenOnStartup: false,
    titlePrefix: "## ",
    dateFormat: "yyyy-MM-dd HH:mm",
    memoNewFilenameFromClipboard: false,
    memoNewFilenameFromSelection: false,
    memoNewFilenameDateSuffix: "",
    locale: "auto"
  };
}

test("pinned memo store persists relative paths and removes duplicates", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-pins-"));
  const settings = createSettings(memodir);

  try {
    await pinMemoByAbsolutePath(settings, join(memodir, "2026", "03", "a.md"));
    await pinMemoByAbsolutePath(settings, join(memodir, "2026", "03", "a.md"));
    await pinMemoByAbsolutePath(settings, join(memodir, "2026", "03", "b.md"));

    assert.equal(getPinnedMemosFilePath(settings), join(memodir, ".vscode-memobox", "pinned-memos.json"));
    assert.deepEqual(await readPinnedMemoRelativePaths(settings), ["2026/03/b.md", "2026/03/a.md"]);

    await unpinMemoByAbsolutePath(settings, join(memodir, "2026", "03", "a.md"));

    assert.deepEqual(await readPinnedMemoRelativePaths(settings), ["2026/03/b.md"]);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});
