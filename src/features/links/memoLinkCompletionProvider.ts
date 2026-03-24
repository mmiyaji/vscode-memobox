import * as vscode from "vscode";
import type { MemoBoxSettings } from "../../core/config/types";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { buildMemoLinkCandidates } from "../../core/memo/memoLinks";
import { areSameFilePath } from "../../shared/filePathComparison";
import { logMemoBoxError, logMemoBoxInfo, logMemoBoxWarn } from "../../shared/logging";
import { buildMemoLinkCompletionText, detectMemoLinkCompletionContext } from "./memoLinkCompletion";

export class MemoLinkCompletionProvider implements vscode.CompletionItemProvider {
  private readonly getSettingsFn: () => MemoBoxSettings;

  constructor(getSettings: () => MemoBoxSettings) {
    this.getSettingsFn = getSettings;
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    if (document.uri.scheme !== "file") {
      return [];
    }

    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const context = detectMemoLinkCompletionContext(linePrefix);
    if (!context) {
      return [];
    }

    const settings = this.getSettingsFn();
    if (settings.memodir.trim() === "") {
      logMemoBoxWarn("links", "Memo link completion skipped because memodir is empty.", {
        filePath: document.uri.fsPath,
        query: context.query
      });
      return [];
    }

    try {
      const entries = await getMemoIndexEntries(settings);
      const currentFileIndexed = entries.some((entry) => areSameFilePath(entry.absolutePath, document.uri.fsPath));
      const candidates = buildMemoLinkCandidates(entries, document.uri.fsPath, {
        query: context.query,
        limit: 50
      });

      logMemoBoxInfo("links", "Memo link completion evaluated.", {
        filePath: document.uri.fsPath,
        currentFileIndexed,
        contextKind: context.kind,
        query: context.query,
        entryCount: entries.length,
        candidateCount: candidates.length,
        topCandidates: candidates.slice(0, 5).map((candidate) => candidate.label)
      });

      if (candidates.length === 0) {
        logMemoBoxWarn("links", "Memo link completion returned no candidates.", {
          filePath: document.uri.fsPath,
          currentFileIndexed,
          contextKind: context.kind,
          query: context.query,
          entryCount: entries.length
        });
        return [];
      }

      const replaceRange = new vscode.Range(position.line, context.replaceStartCharacter, position.line, position.character);

      return candidates.map((candidate, index) => {
        const item = new vscode.CompletionItem(
          {
            label: candidate.label,
            description: candidate.relativePath
          },
          vscode.CompletionItemKind.Reference
        );

        item.range = replaceRange;
        item.insertText = buildMemoLinkCompletionText(context, document.uri.fsPath, candidate.absolutePath, candidate.label);
        item.detail =
          context.kind === "markdownTarget"
            ? "Insert relative memo path"
            : "Insert markdown link to memo";
        item.documentation = new vscode.MarkdownString(
          `\`${candidate.relativePath}\`${candidate.detail ? `\n\n${candidate.detail}` : ""}`
        );
        item.documentation.isTrusted = false;
        item.sortText = String(index).padStart(4, "0");
        item.filterText = buildCompletionFilterText(context.kind, candidate.label, candidate.relativePath);
        item.preselect = index === 0;
        return item;
      });
    } catch (error) {
      logMemoBoxError("links", "Memo link completion failed.", {
        filePath: document.uri.fsPath,
        contextKind: context.kind,
        query: context.query,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  dispose(): void {
    // No-op.
  }
}

function buildCompletionFilterText(
  kind: "wikilinkLike" | "markdownTarget",
  label: string,
  relativePath: string
): string {
  if (kind === "wikilinkLike") {
    return `${label} [[${label}]] [[${label} ${relativePath}`.trim();
  }

  return `${relativePath} ${label} [${label}](${relativePath}`.trim();
}
