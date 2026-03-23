import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import {
  getPinnedMemosBackupFilePath,
  getPinnedMemosFilePath,
  pinMemoByAbsolutePath,
  readPinnedMemoRelativePaths,
  unpinMemoByAbsolutePath
} from "../src/core/meta/pinnedMemos";
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

test("pinned memo store falls back to backup files and repairs the primary file", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-pins-recover-"));
  const settings = createSettings(memodir);

  try {
    await pinMemoByAbsolutePath(settings, join(memodir, "2026", "03", "a.md"));

    await writeFile(getPinnedMemosFilePath(settings), "{broken", "utf8");
    assert.deepEqual(await readPinnedMemoRelativePaths(settings), ["2026/03/a.md"]);

    await writeFile(getPinnedMemosFilePath(settings), "{broken-again", "utf8");
    await rename(getPinnedMemosBackupFilePath(settings), getTransientBackupFilePath(getPinnedMemosFilePath(settings)));

    assert.deepEqual(await readPinnedMemoRelativePaths(settings), ["2026/03/a.md"]);

    const repairedPrimary = JSON.parse(await readFile(getPinnedMemosFilePath(settings), "utf8")) as { version: number };
    assert.equal(repairedPrimary.version, 1);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});
