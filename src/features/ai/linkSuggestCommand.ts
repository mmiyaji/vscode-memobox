import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { basename, dirname, extname, relative } from "node:path";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { areSameFilePath } from "../../shared/filePathComparison";
import { ensureAiReady, getActiveMarkdownAiContext, runAiWithProgress } from "./shared";
import { parseLinkSuggestions } from "./support";

export async function linkSuggestCommand(): Promise<void> {
  const ai = await ensureAiReady();
  const context = getActiveMarkdownAiContext();
  if (!ai || !context) {
    return;
  }

  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);
  if (!memoRoot) {
    return;
  }

  const indexedEntries = await getMemoIndexEntries(settings);
  const candidateEntries = indexedEntries
    .filter((entry) => !areSameFilePath(entry.absolutePath, context.document.uri.fsPath))
    .sort((left, right) => right.mtime.getTime() - left.mtime.getTime())
    .slice(0, 24);

  if (candidateEntries.length === 0) {
    void vscode.window.showInformationMessage("MemoBox: No memo candidates are available for AI link suggestions.");
    return;
  }

  const candidateSummaries = await Promise.all(
    candidateEntries.map(async (entry, index) => {
      const content = await readFile(entry.absolutePath, "utf8").catch(() => "");
      const name = basename(entry.relativePath, extname(entry.relativePath));
      const preview = content.split(/\r?\n/u).filter((line) => line.trim() !== "").slice(0, 4).join(" ").slice(0, 240);
      return `[${index}] ${name}: ${preview}`;
    })
  );

  const prompt = [
    "You are a memo link suggestion assistant.",
    "Find phrases in the current memo that should link to past memos.",
    "- Return ONLY a JSON array.",
    '- Format: [{"keyword":"phrase in current memo","memo_index":0,"reason":"short reason"}]',
    "- Return [] if no suitable links exist.",
    "",
    "## Current memo",
    context.document.getText().slice(0, 3000),
    "",
    "## Candidate memos",
    candidateSummaries.join("\n")
  ].join("\n");

  const rawSuggestions = await runAiWithProgress("MemoBox: Suggesting memo links...", async (signal, progress) => {
    progress.report({ message: "Sending request..." });
    const response = await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
    progress.report({ message: "Processing response..." });
    return response;
  });
  if (!rawSuggestions) {
    return;
  }

  const parsedSuggestions = parseLinkSuggestions(rawSuggestions)
    .filter((item) => item.memo_index >= 0 && item.memo_index < candidateEntries.length);
  if (parsedSuggestions.length === 0) {
    void vscode.window.showInformationMessage("MemoBox: AI did not find suitable memo links.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    parsedSuggestions.map((suggestion) => {
      const target = candidateEntries[suggestion.memo_index];
      return {
        label: `"${suggestion.keyword}" -> ${target?.title?.trim() || target?.relativePath || "memo"}`,
        description: suggestion.reason ?? "",
        picked: true,
        suggestion
      };
    }),
    {
      canPickMany: true,
      ignoreFocusOut: true,
      placeHolder: "Select AI link suggestions to append"
    }
  );
  if (!picked || picked.length === 0) {
    return;
  }

  const appendedSection = [
    "",
    "",
    "## Related Links",
    "",
    ...picked.flatMap((item) => {
      const target = candidateEntries[item.suggestion.memo_index];
      if (!target) {
        return [];
      }

      const relativeTargetPath = relative(dirname(context.document.uri.fsPath), target.absolutePath).replace(/\\/g, "/");
      return [`- [${item.suggestion.keyword}](${relativeTargetPath})`];
    }),
    ""
  ].join("\n");

  await context.editor.edit((builder) => {
    builder.insert(context.document.positionAt(context.document.getText().length), appendedSection);
  });
  await context.document.save();
  void vscode.window.showInformationMessage(`MemoBox: Added ${picked.length} AI link suggestion${picked.length === 1 ? "" : "s"}.`);
}
