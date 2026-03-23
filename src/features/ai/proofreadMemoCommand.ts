import * as vscode from "vscode";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress } from "./shared";

export async function proofreadMemoCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const targetText = context.editor.selection.isEmpty
    ? context.document.getText()
    : context.document.getText(context.editor.selection);
  const prompt = [
    "You are a proofreading assistant.",
    "Find up to 5 clear issues in the markdown text below.",
    "- Focus on typos, grammar, and awkward phrasing.",
    "- Return concise bullet points only.",
    "- If there are no issues, return exactly: No issues found",
    "",
    "---",
    targetText.slice(0, 3000),
    "---"
  ].join("\n");

  const proofreadResult = await runAiWithProgress("MemoBox: Proofreading with AI...", async () => {
    return await runMemoBoxAiPrompt(ai.resolved, prompt);
  });
  if (!proofreadResult) {
    return;
  }

  const output = await vscode.workspace.openTextDocument({
    content: `# AI Proofread\n\n${proofreadResult.trim()}\n`,
    language: "markdown"
  });
  await vscode.window.showTextDocument(output, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true
  });
}
