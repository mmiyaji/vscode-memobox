import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildQuickMemoAppendText, buildQuickMemoInitialContent } from "../src/core/memo/quickMemo";
import type { MemoBoxSettings } from "../src/core/config/types";

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
    maxScanDepth: 4,
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
    aiCostMode: "off",
    aiPerRequestLimitUsd: 0,
    aiMonthlyLimitUsd: 0,
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

test("buildQuickMemoInitialContent uses the preferred memo template for the first daily memo", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-quickmemo-"));

  try {
    await mkdir(join(memodir, ".vscode-memobox", "templates"), { recursive: true });
    await writeFile(
      join(memodir, ".vscode-memobox", "templates", "daily.md"),
      "---\ntitle: '{{title}}'\ntags:\n  - inbox\ndate: {{date}}\n---\n\n# {{.Date}} {{.Title}}\n",
      "utf8"
    );

    const content = await buildQuickMemoInitialContent(createSettings(memodir), new Date(2026, 2, 22));

    assert.match(content, /^---\ntitle: '2026-03-22'\ntags:\n {2}- inbox\ndate: 2026-03-22\n---\n\n# 2026-03-22 2026-03-22\n/u);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("buildQuickMemoAppendText adds a timestamp heading with selected text", () => {
  assert.equal(
    buildQuickMemoAppendText({
      currentContent: "# 2026-03-22\n\n",
      date: new Date(2026, 2, 22, 1, 2),
      selectedText: "Ship review",
      titlePrefix: "## ",
      dateFormat: "yyyy-MM-dd HH:mm"
    }),
    "\n## 2026-03-22 01:02 Ship review\n\n"
  );
});

test("buildQuickMemoAppendText works for empty files", () => {
  assert.equal(
    buildQuickMemoAppendText({
      currentContent: "",
      date: new Date(2026, 2, 22, 1, 2),
      selectedText: "",
      titlePrefix: "## ",
      dateFormat: "yyyy-MM-dd HH:mm"
    }),
    "## 2026-03-22 01:02\n\n"
  );
});
