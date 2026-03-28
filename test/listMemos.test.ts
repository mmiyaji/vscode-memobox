import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { buildMemoListDetail, buildMemoListLabel, listMemos } from "../src/core/memo/listMemos";

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
    logLevel: "info",
    slashCommandsEnabled: true,
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

test("listMemos returns memo files and skips metadata directories", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-list-"));

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    await mkdir(join(memodir, ".vscode-memobox", "templates"), { recursive: true });
    await writeFile(join(memodir, "2026", "03", "2026-03-22-note.md"), "# Ship memo\n\nBody", "utf8");
  await writeFile(join(memodir, ".vscode-memobox", "templates", "simple.md"), "# Template", "utf8");

    const entries = await listMemos(createSettings(memodir));

    assert.equal(entries.length, 1);
    assert.match(entries[0]?.relativePath ?? "", /2026[\\/]+03[\\/]+2026-03-22-note\.md/u);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("listMemos sorts by modified time when requested", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-list-"));

  try {
    await writeFile(join(memodir, "older.md"), "older", "utf8");
    await writeFile(join(memodir, "newer.md"), "newer", "utf8");
    await utimes(join(memodir, "older.md"), new Date(2026, 2, 20), new Date(2026, 2, 20));
    await utimes(join(memodir, "newer.md"), new Date(2026, 2, 22), new Date(2026, 2, 22));

    const entries = await listMemos({
      ...createSettings(memodir),
      listSortOrder: "mtime"
    });

    assert.equal(entries[0]!.relativePath, "newer.md");
    assert.equal(entries[1]!.relativePath, "older.md");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("buildMemoListLabel keeps the relative path for display", () => {
  assert.equal(buildMemoListLabel("2026/03/note.md"), "2026/03/note.md");
});

test("buildMemoListDetail can include birth time information", () => {
  const detail = buildMemoListDetail(
    {
      birthtime: new Date("2026-03-20T01:02:00Z"),
      mtime: new Date("2026-03-22T03:04:00Z")
    },
    { displayFileBirthTime: true }
  );

  assert.match(detail, /^Created /u);
  assert.match(detail, / \| Modified /u);
});
