import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rename, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import {
  clearMemoIndexCache,
  clearMemoIndexStorage,
  getIndexBackupFilePath,
  getIndexFilePath,
  getMemoIndexEntries,
  getMemoIndexStorageState
} from "../src/core/index/memoIndex";
import { getTransientBackupFilePath } from "../src/shared/safeWrite";

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
    excludeDirectories: ["node_modules", "dist", "build", "out", "coverage", "vendor"],
    maxScanDepth: 8,
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
    locale: "auto",
    aiEnabled: false,
    ai: {
      defaultProfile: "local",
      profiles: {
        local: {
          provider: "ollama",
          endpoint: "http://localhost:11434",
          model: "qwen3:1.7b",
          apiKey: "",
          apiKeyEnv: "",
          tagLanguage: "auto",
          timeoutMs: 300000
        }
      },
      network: {
        proxy: "",
        proxyBypass: "",
        tlsRejectUnauthorized: true,
        tlsCaCert: ""
      }
    }
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

test("memo index falls back to backup files and rewrites the primary index", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-index-recover-"));
  clearMemoIndexCache();

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    const memoPath = join(memodir, "2026", "03", "note.md");
    const settings = createSettings(memodir);

    await writeFile(memoPath, "---\ntitle: Recovered\ntags: [alpha]\n---\n\nBody", "utf8");
    await getMemoIndexEntries(settings);

    await writeFile(getIndexFilePath(settings), "{broken", "utf8");

    clearMemoIndexCache();
    const recoveredFromBackup = await getMemoIndexEntries(settings);
    assert.equal(recoveredFromBackup.length, 1);
    assert.equal(recoveredFromBackup[0]?.title, "Recovered");
    const backupState = await getMemoIndexStorageState(settings);
    assert.equal(backupState.loadSource, "backup");

    await writeFile(getIndexFilePath(settings), "{broken-again", "utf8");
    await rename(getIndexBackupFilePath(settings), getTransientBackupFilePath(getIndexFilePath(settings)));

    clearMemoIndexCache();
    const recoveredFromTransient = await getMemoIndexEntries(settings);
    assert.equal(recoveredFromTransient.length, 1);
    const transientState = await getMemoIndexStorageState(settings);
    assert.equal(transientState.loadSource, "transient");

    const repairedPrimary = JSON.parse(await readFile(getIndexFilePath(settings), "utf8")) as { version: number };
    assert.equal(repairedPrimary.version, 2);
  } finally {
    clearMemoIndexCache();
    await rm(memodir, { force: true, recursive: true });
  }
});

test("clearMemoIndexStorage removes primary and backup index files", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-index-clear-"));
  clearMemoIndexCache();

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    const memoPath = join(memodir, "2026", "03", "note.md");
    const settings = createSettings(memodir);

    await writeFile(memoPath, "# note", "utf8");
    await getMemoIndexEntries(settings);

    const removedFiles = await clearMemoIndexStorage(settings);
    assert.equal(removedFiles >= 2, true);

    const storageState = await getMemoIndexStorageState(settings);
    assert.equal(storageState.primaryExists, false);
    assert.equal(storageState.backupExists, false);
    assert.equal(storageState.transientBackupExists, false);
  } finally {
    clearMemoIndexCache();
    await rm(memodir, { force: true, recursive: true });
  }
});

test("memo index respects excluded directories and max scan depth", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-index-scan-"));
  clearMemoIndexCache();

  try {
    await mkdir(join(memodir, "allowed", "level1"), { recursive: true });
    await mkdir(join(memodir, "allowed", "level1", "level2"), { recursive: true });
    await mkdir(join(memodir, "node_modules"), { recursive: true });
    await writeFile(join(memodir, "allowed", "level1", "note.md"), "# include", "utf8");
    await writeFile(join(memodir, "allowed", "level1", "level2", "deep.md"), "# too deep", "utf8");
    await writeFile(join(memodir, "node_modules", "skip.md"), "# skip", "utf8");

    const entries = await getMemoIndexEntries({
      ...createSettings(memodir),
      maxScanDepth: 2,
      excludeDirectories: ["node_modules"]
    });

    assert.deepEqual(
      entries.map((entry) => entry.relativePath).sort(),
      ["allowed/level1/note.md"]
    );
  } finally {
    clearMemoIndexCache();
    await rm(memodir, { force: true, recursive: true });
  }
});
