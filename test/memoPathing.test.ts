import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import { getDefaultTemplatePath, getMemoDateDirectory, getMemoFilePath, getQuickMemoFilePath } from "../src/core/memo/pathing";

const settings: MemoBoxSettings = {
  memodir: "/memo",
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

test("getMemoDateDirectory uses the configured date path format", () => {
  assert.equal(
    getMemoDateDirectory(settings, new Date(2026, 2, 22)),
    normalize("/memo/2026/03")
  );
});

test("getMemoFilePath combines directory and generated file name", () => {
  assert.equal(
    getMemoFilePath(settings, new Date(2026, 2, 22), "Sprint Review"),
    normalize("/memo/2026/03/2026-03-22-Sprint-Review.md")
  );
});

test("getQuickMemoFilePath points to the daily memo file", () => {
  assert.equal(
    getQuickMemoFilePath(settings, new Date(2026, 2, 22)),
    normalize("/memo/2026/03/2026-03-22.md")
  );
});

test("getDefaultTemplatePath resolves under the metadata directory", () => {
  assert.equal(
    getDefaultTemplatePath(settings),
    normalize("/memo/.vscode-memobox/templates/daily.md")
  );
});
