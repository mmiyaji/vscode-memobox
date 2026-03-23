import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { createTodoRegExp, findTodoMemos } from "../src/core/memo/todoMemos";

function createSettings(memodir: string, todoPattern = "^.*@todo.*?:"): MemoBoxSettings {
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
    todoPattern,
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

test("findTodoMemos matches todo lines with the configured pattern", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-todo-"));

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    await writeFile(
      join(memodir, "2026", "03", "memo.md"),
      "plain line\n* [ ] @todo: Submit to customer\n- @TODO: Call back\n",
      "utf8"
    );

    const matches = (await findTodoMemos(createSettings(memodir))).matches;

    assert.equal(matches.length, 2);
    assert.equal(matches[0]?.lineNumber, 2);
    assert.equal(matches[0]?.columnNumber, 1);
    assert.match(matches[0]?.lineText ?? "", /Submit to customer/);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("findTodoMemos supports scoped search", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-todo-"));

  try {
    await mkdir(join(memodir, "2026", "03"), { recursive: true });
    await mkdir(join(memodir, "2026", "04"), { recursive: true });
    await writeFile(join(memodir, "2026", "03", "memo.md"), "@todo: March\n", "utf8");
    await writeFile(join(memodir, "2026", "04", "memo.md"), "@todo: April\n", "utf8");

    const matches = (await findTodoMemos(createSettings(memodir), { kind: "subfolder", prefix: "2026/04/" })).matches;

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.relativePath, "2026/04/memo.md");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("createTodoRegExp throws for invalid regular expressions", () => {
  assert.throws(() => createTodoRegExp("("), /Invalid regular expression/);
});
