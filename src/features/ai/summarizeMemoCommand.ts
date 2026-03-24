import * as vscode from "vscode";
import { setFrontmatterScalar } from "../../core/memo/frontmatterEdit";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress, unwrapAiTextResponse } from "./shared";

export async function summarizeMemoCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const prompt = [
    "You are a memo summarization assistant.",
    "Summarize the following markdown memo in 1 to 2 concise sentences.",
    "- Return ONLY the summary text.",
    "- No preamble.",
    "",
    "---",
    context.document.getText().slice(0, 4000),
    "---"
  ].join("\n");

  const rawSummary = await runAiWithProgress("MemoBox: Generating summary...", async (signal, progress) => {
    progress.report({ message: "Sending request..." });
    const response = await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
    progress.report({ message: "Processing response..." });
    return response;
  });
  if (!rawSummary) {
    return;
  }

  const summary = unwrapAiTextResponse(rawSummary).replace(/^["']|["']$/gu, "");
  if (summary === "") {
    void vscode.window.showWarningMessage("MemoBox: The AI summary was empty.");
    return;
  }

  const updatedText = setFrontmatterScalar(context.document.getText(), "description", summary);
  await context.editor.edit((builder) => {
    builder.replace(new vscode.Range(context.document.positionAt(0), context.document.positionAt(context.document.getText().length)), updatedText);
  });
  await context.document.save();
  void vscode.window.showInformationMessage("MemoBox: Added an AI summary to frontmatter.");
}
