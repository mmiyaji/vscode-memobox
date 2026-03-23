import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { grepMemos } from "../src/core/memo/grepMemos";
import { buildGrepResultsText } from "../src/core/memo/grepRender";
import { createDefaultGrepScopes, filterEntriesByGrepScope, listIndexedDirectories } from "../src/core/memo/grepScopes";

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

test("grepMemos returns line and column matches and skips metadata directories", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-grep-"));

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    await mkdir(join(memodir, ".vscode-memobox", "templates"), { recursive: true });
    await writeFile(join(memodir, "2026", "03", "memo.md"), "hello\nship memo\n", "utf8");
  await writeFile(join(memodir, ".vscode-memobox", "templates", "simple.md"), "ship template", "utf8");

    const result = await grepMemos(createSettings(memodir), "ship");
    const { matches } = result;

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.lineNumber, 2);
    assert.equal(matches[0]?.columnNumber, 1);
    assert.equal(matches[0]?.lineText, "ship memo");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("grepMemos uses smart-case matching", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-grep-"));

  try {
    await writeFile(join(memodir, "memo.md"), "Ship memo\nship log\n", "utf8");

    const insensitiveMatches = (await grepMemos(createSettings(memodir), "ship")).matches;
    const sensitiveMatches = (await grepMemos(createSettings(memodir), "Ship")).matches;

    assert.equal(insensitiveMatches.length, 2);
    assert.equal(sensitiveMatches.length, 1);
    assert.equal(sensitiveMatches[0]?.lineNumber, 1);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("grepMemos returns multiple matches from the same line", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-grep-"));

  try {
    await writeFile(join(memodir, "memo.md"), "ship ship ship\n", "utf8");

    const matches = (await grepMemos(createSettings(memodir), "ship")).matches;

    assert.equal(matches.length, 3);
    assert.deepEqual(
      matches.map((match) => match.columnNumber),
      [1, 6, 11]
    );
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("grepMemos supports scoped search by subfolder", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-grep-"));

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    await mkdir(join(memodir, "2026", "04"), { recursive: true });
    await writeFile(join(memodir, "2026", "03", "memo.md"), "ship march\n", "utf8");
    await writeFile(join(memodir, "2026", "04", "memo.md"), "ship april\n", "utf8");

    const matches = (
      await grepMemos(
      createSettings(memodir),
      "ship",
      { kind: "subfolder", prefix: "2026/03/" }
      )
    ).matches;

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.relativePath, "2026/03/memo.md");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("grep scopes provide default options and filter indexed entries", () => {
  const scopes = createDefaultGrepScopes(new Date(2026, 2, 22));
  assert.equal(scopes[0]?.label, "All memos");
  assert.equal(scopes[1]?.description, "2026");
  assert.equal(scopes[2]?.description, "2026/03");

  const filtered = filterEntriesByGrepScope(
    [
      { absolutePath: "a", relativePath: "2026/03/a.md", birthtime: new Date(), mtime: new Date(), size: 1, tags: [] },
      { absolutePath: "b", relativePath: "2026/04/b.md", birthtime: new Date(), mtime: new Date(), size: 1, tags: [] }
    ],
    { kind: "month", prefix: "2026/03/" }
  );
  assert.deepEqual(filtered.map((entry) => entry.relativePath), ["2026/03/a.md"]);
  assert.deepEqual(listIndexedDirectories(filtered), ["2026/03"]);
});

test("buildGrepResultsText formats grep matches for document-style output", () => {
  const content = buildGrepResultsText("ship", "This month", [
    {
      absolutePath: "/memo/2026/03/a.md",
      relativePath: "2026/03/a.md",
      lineNumber: 4,
      columnNumber: 2,
      lineText: "ship memo",
      matchLength: 4
    }
  ]);

  assert.match(content, /# MemoBox Grep/);
  assert.match(content, /Query: ship/);
  assert.match(content, /2026\/03\/a\.md:4:2/);
});
