import * as vscode from "vscode";
import { ensureAiReady, getActiveMarkdownAiContext, runAiPromptWithGuards, unwrapAiTextResponse } from "./shared";

export async function askMemoQuestionCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const question = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: "Ask a question about the active memo",
    placeHolder: "What are the main decisions in this memo?"
  });
  if (!question) {
    return;
  }

  const prompt = [
    "You are an assistant that answers questions strictly from memo content.",
    "- Use only the memo below as evidence.",
    "- If the answer is not in the memo, say so plainly.",
    "- Keep the answer concise.",
    "",
    "## Memo",
    context.document.getText().slice(0, 5000),
    "",
    "## Question",
    question
  ].join("\n");

  const answer = await runAiPromptWithGuards("MemoBox: Answering question...", ai, prompt);
  if (!answer) {
    return;
  }

  const normalizedAnswer = unwrapAiTextResponse(answer);
  if (normalizedAnswer === "") {
    void vscode.window.showWarningMessage("MemoBox: The AI answer was empty.");
    return;
  }

  const output = await vscode.workspace.openTextDocument({
    content: `# AI Q&A\n\n**Q:** ${question}\n\n**A:** ${normalizedAnswer}\n`,
    language: "markdown"
  });
  await vscode.window.showTextDocument(output, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true
  });
}
