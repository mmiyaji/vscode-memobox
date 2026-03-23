import * as vscode from "vscode";
import { setFrontmatterScalar, updateFirstHeading } from "../../core/memo/frontmatterEdit";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, parseJsonStringArray, runAiWithProgress } from "./shared";

export async function generateAiTitleCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const prompt = [
    "You are a memo title generation assistant.",
    "Read the markdown memo and propose 3 concise title candidates.",
    "- Return ONLY a JSON array of strings.",
    "- Reflect the actual content.",
    "",
    "---",
    context.document.getText().slice(0, 4000),
    "---"
  ].join("\n");

  const rawTitles = await runAiWithProgress("MemoBox: Generating title candidates...", async (signal) => {
    return await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
  });
  if (!rawTitles) {
    return;
  }

  const titleCandidates = parseJsonStringArray(rawTitles);
  if (titleCandidates.length === 0) {
    void vscode.window.showWarningMessage("MemoBox: No title candidates were returned.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    titleCandidates.map((title) => ({ label: title })),
    {
      ignoreFocusOut: true,
      placeHolder: "Select a generated title"
    }
  );
  if (!picked) {
    return;
  }

  const withFrontmatterTitle = setFrontmatterScalar(context.document.getText(), "title", picked.label);
  const updatedText = updateFirstHeading(withFrontmatterTitle, picked.label);
  await context.editor.edit((builder) => {
    builder.replace(new vscode.Range(context.document.positionAt(0), context.document.positionAt(context.document.getText().length)), updatedText);
  });
  await context.document.save();
  void vscode.window.showInformationMessage("MemoBox: Updated the memo title from AI suggestions.");
}
