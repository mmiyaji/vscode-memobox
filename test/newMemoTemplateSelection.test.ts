import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import type { MemoBoxSettings } from "../src/core/config/types";
import {
  buildNewMemoTemplateSelectionPlan,
  type MemoTemplateAsset
} from "../src/core/meta/memoAssets";

function createSettings(overrides: Partial<MemoBoxSettings> = {}): MemoBoxSettings {
  return {
    memodir: "/memo",
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
    ...overrides
  };
}

function createTemplateAsset(name: string): MemoTemplateAsset {
  return {
    absolutePath: join("/memo", ".vscode-memobox", "templates", name),
    name,
    size: 10,
    updatedAt: new Date("2026-03-22T00:00:00Z")
  };
}

test("buildNewMemoTemplateSelectionPlan uses the default flow when no template files exist", () => {
  const plan = buildNewMemoTemplateSelectionPlan(createSettings(), []);

  assert.equal(plan.mode, "default");
  assert.deepEqual(plan.options, []);
});

test("buildNewMemoTemplateSelectionPlan auto-selects a single non-default template", () => {
  const plan = buildNewMemoTemplateSelectionPlan(createSettings(), [createTemplateAsset("meeting.md")]);

  assert.equal(plan.mode, "template");
  assert.equal(plan.templatePath, createTemplateAsset("meeting.md").absolutePath);
});

test("buildNewMemoTemplateSelectionPlan keeps the default flow for a lone default template", () => {
  const plan = buildNewMemoTemplateSelectionPlan(createSettings(), [createTemplateAsset("simple.md")]);

  assert.equal(plan.mode, "default");
});

test("buildNewMemoTemplateSelectionPlan prompts when multiple templates exist", () => {
  const plan = buildNewMemoTemplateSelectionPlan(createSettings(), [
    createTemplateAsset("simple.md"),
    createTemplateAsset("meeting.md")
  ]);

  assert.equal(plan.mode, "pick");
  assert.equal(plan.options.length, 3);
  assert.equal(plan.options[0]?.kind, "default");
  assert.equal(plan.options[1]?.isDefault, true);
  assert.equal(plan.options[2]?.isDefault, false);
});

test("buildNewMemoTemplateSelectionPlan respects an explicit default template override", () => {
  const settings = createSettings({
    memotemplate: join("/memo", ".vscode-memobox", "templates", "meeting.md")
  });
  const plan = buildNewMemoTemplateSelectionPlan(settings, [
    createTemplateAsset("simple.md"),
    createTemplateAsset("meeting.md")
  ]);

  assert.equal(plan.mode, "pick");
  assert.equal(plan.options[0]?.absolutePath, settings.memotemplate);
  assert.equal(plan.options[2]?.isDefault, true);
});
