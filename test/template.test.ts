import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { buildNewMemoContent, renderMemoTemplate } from "../src/core/memo/template";

function createSettings(memodir: string, overrides: Partial<MemoBoxSettings> = {}): MemoBoxSettings {
  const { excludeDirectories, maxScanDepth, ...restOverrides } = overrides;
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
    },
    ...restOverrides,
    excludeDirectories: excludeDirectories ?? ["node_modules", "dist", "build", "out", "coverage", "vendor"],
    maxScanDepth: maxScanDepth ?? 8
  };
}

test("renderMemoTemplate replaces supported title and date placeholders", () => {
  assert.equal(renderMemoTemplate("# {{date}} {{.Title}}", { date: "2026-03-22", title: "Plan" }), "# 2026-03-22 Plan");
});

test("renderMemoTemplate replaces title inside single-quoted frontmatter templates", () => {
  assert.equal(
    renderMemoTemplate("title: '{{title}}'", { date: "2026-03-22", title: "Plan" }),
    "title: 'Plan'"
  );
});

test("buildNewMemoContent uses an explicit template path when one is selected", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-template-"));

  try {
    const templatePath = join(memodir, "meeting.md");
    await writeFile(templatePath, "---\ntitle: '{{title}}'\ntags:\n  - meeting\n---\n\n# {{date}}\n\n{{title}}\n", "utf8");

    const content = await buildNewMemoContent(
      createSettings(memodir),
      "Weekly review",
      new Date("2026-03-22T00:00:00Z"),
      templatePath
    );

    assert.equal(content, "---\ntitle: 'Weekly review'\ntags:\n  - meeting\n---\n\n# 2026-03-22\n\nWeekly review\n");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});
