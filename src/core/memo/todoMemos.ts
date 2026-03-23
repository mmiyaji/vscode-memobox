import { readFile } from "node:fs/promises";
import type { MemoBoxSettings } from "../config/types";
import { getMemoIndexEntries } from "../index/memoIndex";
import { filterEntriesByGrepScope, type MemoGrepScope } from "./grepScopes";
import type { MemoSearchResult } from "./grepMemos";
import type { MemoTextMatch } from "./textMatch";

export async function findTodoMemos(
  settings: MemoBoxSettings,
  scope: MemoGrepScope = { kind: "all" },
  options: {
    readonly maxResults?: number;
    readonly isCancellationRequested?: () => boolean;
  } = {}
): Promise<MemoSearchResult> {
  const todoPattern = createTodoRegExp(settings.todoPattern);
  const files = filterEntriesByGrepScope(await getMemoIndexEntries(settings), scope);
  const results: MemoTextMatch[] = [];
  const maxResults = options.maxResults && options.maxResults > 0 ? options.maxResults : Number.POSITIVE_INFINITY;
  let skippedFiles = 0;

  for (const file of files) {
    if (options.isCancellationRequested?.()) {
      return { matches: results, truncated: false, cancelled: true, skippedFiles };
    }

    let content: string;
    try {
      content = await readFile(file.absolutePath, "utf8");
    } catch {
      skippedFiles += 1;
      continue;
    }

    const lines = content.split(/\r?\n/u);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (options.isCancellationRequested?.()) {
        return { matches: results, truncated: false, cancelled: true, skippedFiles };
      }

      const line = lines[lineIndex] ?? "";
      todoPattern.lastIndex = 0;
      const match = todoPattern.exec(line);

      if (!match) {
        continue;
      }

      const matchText = match[0] ?? "";
      results.push({
        absolutePath: file.absolutePath,
        relativePath: file.relativePath,
        lineNumber: lineIndex + 1,
        columnNumber: (match.index ?? 0) + 1,
        matchLength: Math.max(matchText.length, 1),
        lineText: line.trim()
      });

      if (results.length >= maxResults) {
        return { matches: results, truncated: true, cancelled: false, skippedFiles };
      }
    }
  }

  return { matches: results, truncated: false, cancelled: false, skippedFiles };
}

export function createTodoRegExp(pattern: string): RegExp {
  const normalizedPattern = pattern.trim();
  return new RegExp(normalizedPattern === "" ? "^.*@todo.*?:" : normalizedPattern, "iu");
}
