import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { clearMemoIndexCache, getIndexFilePath, getMemoIndexEntries } from "../src/core/index/memoIndex";

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

test("memo index refreshes changed files and removes deleted files", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-index-"));
  clearMemoIndexCache();

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    const memoPath = join(memodir, "2026", "03", "note.md");
    const removedPath = join(memodir, "2026", "03", "old.md");

    await writeFile(memoPath, "---\ntitle: First title\ntags: [alpha, beta]\n---\n\nBody", "utf8");
    await writeFile(removedPath, "old", "utf8");

    const firstEntries = await getMemoIndexEntries(createSettings(memodir));
    assert.equal(firstEntries.length, 2);
    const indexedMemo = firstEntries.find((entry) => entry.relativePath.endsWith("note.md"));
    assert.equal(indexedMemo?.title, "First title");
    assert.deepEqual(indexedMemo?.tags, ["alpha", "beta"]);
    assert.ok((indexedMemo?.size ?? 0) > 0);
    assert.equal(Object.prototype.hasOwnProperty.call(firstEntries[0], "content"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(firstEntries[0], "previewText"), false);
    const persisted = JSON.parse(await readFile(getIndexFilePath(createSettings(memodir)), "utf8")) as {
      version: number;
      entries: Array<{ relativePath: string }>;
    };
    assert.equal(persisted.version, 2);
    assert.equal(persisted.entries.length, 2);

    await writeFile(memoPath, "# Updated title\n\nBody", "utf8");
    await utimes(memoPath, new Date(2026, 2, 23), new Date(2026, 2, 23));
    await rm(removedPath, { force: true });

    const secondEntries = await getMemoIndexEntries(createSettings(memodir));
    assert.equal(secondEntries.length, 1);
    assert.equal(secondEntries[0]?.size, 21);

    clearMemoIndexCache();
    const thirdEntries = await getMemoIndexEntries(createSettings(memodir));
    assert.equal(thirdEntries.length, 1);
    assert.equal(thirdEntries[0]?.relativePath.endsWith("note.md"), true);
  } finally {
    clearMemoIndexCache();
    await rm(memodir, { force: true, recursive: true });
  }
});
