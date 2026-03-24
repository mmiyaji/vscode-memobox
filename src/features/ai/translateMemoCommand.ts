import * as vscode from "vscode";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress, unwrapAiTextResponse } from "./shared";

export async function translateMemoCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const direction = await vscode.window.showQuickPick(
    [
      { label: "Auto-detect -> Japanese", source: "auto-detected language", target: "Japanese" },
      { label: "Auto-detect -> English", source: "auto-detected language", target: "English" },
      { label: "Japanese -> English", source: "Japanese", target: "English" },
      { label: "English -> Japanese", source: "English", target: "Japanese" }
    ],
    {
      ignoreFocusOut: true,
      placeHolder: "Select the translation direction"
    }
  );
  if (!direction) {
    return;
  }

  const sourceText = context.editor.selection.isEmpty
    ? context.document.getText()
    : context.document.getText(context.editor.selection);
  const prompt = [
    `You are a professional translator from ${direction.source} to ${direction.target}.`,
    "Translate the markdown below while preserving headings, lists, links, and code fences.",
    "- Return ONLY the translated markdown.",
    "- Do not add notes or explanations.",
    "",
    "---",
    sourceText.slice(0, 5000),
    "---"
  ].join("\n");

  const translated = await runAiWithProgress("MemoBox: Translating with AI...", async (signal, progress) => {
    progress.report({ message: "Sending request..." });
    const response = await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
    progress.report({ message: "Processing response..." });
    return response;
  });
  if (!translated) {
    return;
  }

  const normalizedTranslation = unwrapAiTextResponse(translated);
  if (normalizedTranslation === "") {
    void vscode.window.showWarningMessage("MemoBox: The AI translation was empty.");
    return;
  }

  if (context.editor.selection.isEmpty) {
    const output = await vscode.workspace.openTextDocument({
      content: `${normalizedTranslation}\n`,
      language: "markdown"
    });
    await vscode.window.showTextDocument(output, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false
    });
    return;
  }

  await context.editor.edit((builder) => {
    builder.replace(context.editor.selection, normalizedTranslation);
  });
}
