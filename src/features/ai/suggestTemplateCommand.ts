import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { getTemplatesDirectory, listTemplateAssets } from "../../core/meta/memoAssets";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress } from "./shared";

export async function suggestTemplateCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const templatesDirectory = getTemplatesDirectory(ai.settings);
  const templateAssets = await listTemplateAssets(ai.settings);
  if (templateAssets.length === 0) {
    void vscode.window.showWarningMessage(`MemoBox: No templates were found in ${templatesDirectory}.`);
    return;
  }

  const templateSummaries = await Promise.all(
    templateAssets.slice(0, 12).map(async (asset, index) => {
      const body = await readFile(asset.absolutePath, "utf8").catch(() => "");
      return `[${index}] ${asset.name}: ${body.split(/\r?\n/u).slice(0, 4).join(" ").slice(0, 240)}`;
    })
  );

  const prompt = [
    "You are a template suggestion assistant.",
    "Choose the most suitable template for the memo content below.",
    "- Return ONLY the numeric template index.",
    "- Return -1 if none are suitable.",
    "",
    "## Memo",
    context.document.getText().slice(0, 3000),
    "",
    "## Templates",
    templateSummaries.join("\n")
  ].join("\n");

  const result = await runAiWithProgress("MemoBox: Suggesting a template...", async () => {
    return await runMemoBoxAiPrompt(ai.resolved, prompt);
  });
  if (!result) {
    return;
  }

  const suggestedIndex = Number.parseInt(result.replace(/[^\d-]/gu, ""), 10);
  if (!Number.isFinite(suggestedIndex) || suggestedIndex < 0 || suggestedIndex >= templateAssets.length) {
    void vscode.window.showInformationMessage("MemoBox: AI did not find a suitable template.");
    return;
  }

  const suggestedTemplate = templateAssets[suggestedIndex];
  if (!suggestedTemplate) {
    void vscode.window.showWarningMessage("MemoBox: The suggested template is no longer available.");
    return;
  }
  const decision = await vscode.window.showQuickPick(
    [
      { label: `Apply ${suggestedTemplate.name}`, mode: "apply" },
      { label: "Pick another template", mode: "pick" }
    ],
    {
      ignoreFocusOut: true,
      placeHolder: `Suggested template: ${suggestedTemplate.name}`
    }
  );
  if (!decision) {
    return;
  }

  const selectedTemplate = decision.mode === "apply"
    ? suggestedTemplate
    : await pickTemplateAsset(templateAssets);
  if (!selectedTemplate) {
    return;
  }

  const templateContent = await readFile(selectedTemplate.absolutePath, "utf8");
  await context.editor.edit((builder) => {
    builder.replace(
      new vscode.Range(context.document.positionAt(0), context.document.positionAt(context.document.getText().length)),
      templateContent
    );
  });
  void vscode.window.showInformationMessage(`MemoBox: Applied template ${basename(selectedTemplate.absolutePath)}.`);
}

async function pickTemplateAsset(
  templateAssets: readonly { absolutePath: string; name: string }[]
): Promise<{ absolutePath: string; name: string } | undefined> {
  const picked = await vscode.window.showQuickPick(
    templateAssets.map((asset) => ({
      label: asset.name,
      asset
    })),
    {
      ignoreFocusOut: true,
      placeHolder: "Select a template"
    }
  );

  return picked?.asset;
}
