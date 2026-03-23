import * as vscode from "vscode";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { setFrontmatterStringList } from "../../core/memo/frontmatterEdit";
import { buildMemoTagSummaries } from "../../core/memo/tags";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, parseJsonStringArray, runAiWithProgress } from "./shared";

export async function autoTagMemoCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const knownTags = ai.settings.memodir.trim() === ""
    ? []
    : buildMemoTagSummaries(await getMemoIndexEntries(ai.settings), 100).map((item) => item.tag);
  const prompt = [
    "You are a memo tagging assistant.",
    "Read the markdown memo below and propose 3 to 7 concise tags.",
    "- Return ONLY a JSON array of strings.",
    "- Reuse existing tags when they fit the content.",
    knownTags.length > 0 ? `- Existing tags: ${knownTags.join(", ")}` : "",
    "",
    "---",
    context.document.getText().slice(0, 4000),
    "---"
  ].filter((line) => line !== "").join("\n");

  const rawResult = await runAiWithProgress("MemoBox: Generating tags...", async () => {
    return await runMemoBoxAiPrompt(ai.resolved, prompt);
  });
  if (!rawResult) {
    return;
  }

  const suggestedTags = parseJsonStringArray(rawResult);
  if (suggestedTags.length === 0) {
    void vscode.window.showWarningMessage("MemoBox: No tags were returned.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    suggestedTags.map((tag) => ({ label: tag, picked: true })),
    {
      canPickMany: true,
      ignoreFocusOut: true,
      placeHolder: "Select tags to apply"
    }
  );
  if (!picked || picked.length === 0) {
    return;
  }

  const updatedText = setFrontmatterStringList(
    context.document.getText(),
    "tags",
    picked.map((item) => item.label)
  );
  await replaceWholeDocument(context.editor, context.document, updatedText);
  await context.document.save();
  void vscode.window.showInformationMessage(`MemoBox: Applied ${picked.length} AI tag${picked.length === 1 ? "" : "s"}.`);
}

async function replaceWholeDocument(editor: vscode.TextEditor, document: vscode.TextDocument, text: string): Promise<void> {
  await editor.edit((builder) => {
    builder.replace(new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), text);
  });
}
