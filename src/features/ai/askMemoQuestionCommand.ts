import * as vscode from "vscode";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress } from "./shared";

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

  const answer = await runAiWithProgress("MemoBox: Answering question...", async () => {
    return await runMemoBoxAiPrompt(ai.resolved, prompt);
  });
  if (!answer) {
    return;
  }

  const output = await vscode.workspace.openTextDocument({
    content: `# AI Q&A\n\n**Q:** ${question}\n\n**A:** ${answer.trim()}\n`,
    language: "markdown"
  });
  await vscode.window.showTextDocument(output, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true
  });
}
