import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { format } from "date-fns";
import { readSettings } from "../../core/config/settings";
import { getMemoIndexEntries, type MemoIndexedEntry } from "../../core/index/memoIndex";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { runMemoBoxAiPrompt } from "../../infra/ai/client";
import { ensureAiReady, runAiWithProgress, unwrapAiTextResponse } from "./shared";
import { resolveReportStartDate, type ReportRangeValue } from "./support";

interface ReportRangeOption {
  readonly label: string;
  readonly value: ReportRangeValue;
}

export async function reportMemoCommand(): Promise<void> {
  const ai = await ensureAiReady();
  if (!ai) {
    return;
  }

  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);
  if (!memoRoot) {
    return;
  }

  const range = await vscode.window.showQuickPick<ReportRangeOption>(
    [
      { label: "Today", value: "today" },
      { label: "Last 3 days", value: "3days" },
      { label: "This week", value: "week" },
      { label: "Last 7 days", value: "7days" }
    ],
    {
      ignoreFocusOut: true,
      placeHolder: "Select the report period"
    }
  );
  if (!range) {
    return;
  }

  const now = new Date();
  const since = resolveReportStartDate(range.value, now);
  const indexedEntries = await getMemoIndexEntries(settings);
  const recentEntries = indexedEntries
    .filter((entry) => entry.mtime.getTime() >= since.getTime())
    .sort((left, right) => right.mtime.getTime() - left.mtime.getTime())
    .slice(0, 24);

  if (recentEntries.length === 0) {
    void vscode.window.showInformationMessage("MemoBox: No memos were found in the selected period.");
    return;
  }

  const memoSections = await buildReportMemoSections(recentEntries);
  const periodLabel = `${format(since, "yyyy/MM/dd")} - ${format(now, "yyyy/MM/dd")}`;
  const prompt = [
    "You are a memo report assistant.",
    `Generate a concise markdown report for the period ${periodLabel} from the memo excerpts below.`,
    "- Include sections for highlights, in progress, and issues when relevant.",
    "- Keep the report compact and practical.",
    "- Return ONLY markdown.",
    "",
    memoSections.join("\n\n")
  ].join("\n");

  const report = await runAiWithProgress("MemoBox: Generating AI report...", async (signal, progress) => {
    progress.report({ message: "Sending request..." });
    const response = await runMemoBoxAiPrompt(ai.resolved, prompt, { signal });
    progress.report({ message: "Processing response..." });
    return response;
  });
  if (!report) {
    return;
  }

  const normalizedReport = unwrapAiTextResponse(report);
  if (normalizedReport === "") {
    void vscode.window.showWarningMessage("MemoBox: The AI report was empty.");
    return;
  }

  const output = await vscode.workspace.openTextDocument({
    content: `# AI Report ${periodLabel}\n\n${normalizedReport}\n`,
    language: "markdown"
  });
  await vscode.window.showTextDocument(output, {
    preview: false,
    viewColumn: vscode.ViewColumn.One
  });
}

async function buildReportMemoSections(entries: readonly MemoIndexedEntry[]): Promise<readonly string[]> {
  return await Promise.all(
    entries.map(async (entry) => {
      const content = await readFile(entry.absolutePath, "utf8").catch(() => "");
      return `## ${entry.relativePath}\n${content.slice(0, 800)}`;
    })
  );
}
