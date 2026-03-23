import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import {
  ensureMemoMetaDirectories,
  getSnippetsDirectory,
  getTemplatesDirectory,
  listSnippetAssets,
  listTemplateAssets,
  readSnippetDefinitions
} from "../src/core/meta/memoAssets";

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

test("ensureMemoMetaDirectories creates template and snippet directories", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-assets-"));

  try {
    await ensureMemoMetaDirectories(createSettings(memodir));

    const templates = await listTemplateAssets(createSettings(memodir));
    const snippets = await listSnippetAssets(createSettings(memodir));

    assert.deepEqual(
      templates.map((item) => item.name),
      ["meeting.md", "simple.md"]
    );
    assert.deepEqual(
      snippets.map((item) => item.name),
      ["memo.json"]
    );

    const simpleTemplate = await readFile(join(memodir, ".vscode-memobox", "templates", "simple.md"), "utf8");
    const scaffoldSnippets = await readFile(join(memodir, ".vscode-memobox", "snippets", "memo.json"), "utf8");

    assert.match(simpleTemplate, /^---\ntitle: '\{\{title\}\}'\ntags:\n {2}- inbox\ndate: \{\{date\}\}\n---/u);
    assert.match(scaffoldSnippets, /"title: '\$\{1:Title\}'"/u);
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("readSnippetDefinitions normalizes VS Code snippet JSON", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-assets-"));

  try {
    const filePath = join(memodir, "sample.json");
    await writeFile(
      filePath,
      JSON.stringify({
        heading: {
          prefix: ["memo-h1", "mh1"],
          body: ["# ${1:Title}", "", "$0"],
          description: "Insert heading"
        }
      }),
      "utf8"
    );

    const definitions = await readSnippetDefinitions(filePath);

    assert.equal(definitions.length, 1);
    assert.deepEqual(definitions[0]?.prefixes, ["memo-h1", "mh1"]);
    assert.equal(definitions[0]?.body, "# ${1:Title}\n\n$0");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("listTemplateAssets and listSnippetAssets read memo asset directories", async () => {
  const memodir = await mkdtemp(join(tmpdir(), "memobox-assets-"));
  const settings = createSettings(memodir);

  try {
    await mkdir(join(memodir, ".vscode-memobox", "templates"), { recursive: true });
    await mkdir(join(memodir, ".vscode-memobox", "snippets"), { recursive: true });
    await writeFile(join(memodir, ".vscode-memobox", "templates", "simple.md"), "# template\n", "utf8");
    await writeFile(
      join(memodir, ".vscode-memobox", "snippets", "markdown.json"),
      JSON.stringify({
        note: {
          prefix: "memo-note",
          body: "## ${1:Title}",
          description: "Insert note heading"
        }
      }),
      "utf8"
    );

    const templates = await listTemplateAssets(settings);
    const snippets = await listSnippetAssets(settings);

    assert.equal(templates.length, 1);
    assert.equal(templates[0]?.name, "simple.md");
    assert.equal(snippets.length, 1);
    assert.equal(snippets[0]?.snippets.length, 1);
    assert.equal(snippets[0]?.snippets[0]?.prefixes[0], "memo-note");
  } finally {
    await rm(memodir, { force: true, recursive: true });
  }
});

test("memo asset directories can be overridden explicitly", () => {
  const settings = createSettings("/memo");
  const customSettings: MemoBoxSettings = {
    ...settings,
    templatesDir: "/custom/templates",
    snippetsDir: "/custom/snippets"
  };

  assert.equal(getTemplatesDirectory(customSettings), normalize("/custom/templates"));
  assert.equal(getSnippetsDirectory(customSettings), normalize("/custom/snippets"));
});
