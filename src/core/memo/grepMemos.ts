import { readFile } from "node:fs/promises";
import type { MemoBoxSettings } from "../config/types";
import { getMemoIndexEntries } from "../index/memoIndex";
import { filterEntriesByGrepScope, type MemoGrepScope } from "./grepScopes";
import type { MemoTextMatch } from "./textMatch";

export interface MemoSearchResult {
  readonly matches: readonly MemoTextMatch[];
  readonly truncated: boolean;
  readonly cancelled: boolean;
}

export async function grepMemos(
  settings: MemoBoxSettings,
  query: string,
  scope: MemoGrepScope = { kind: "all" },
  options: {
    readonly maxResults?: number;
    readonly isCancellationRequested?: () => boolean;
  } = {}
): Promise<MemoSearchResult> {
  const trimmedQuery = query.trim();
  if (trimmedQuery === "") {
    return { matches: [], truncated: false, cancelled: false };
  }

  const files = filterEntriesByGrepScope(await getMemoIndexEntries(settings), scope);
  const results: MemoTextMatch[] = [];
  const caseSensitive = hasUppercase(trimmedQuery);
  const maxResults = options.maxResults && options.maxResults > 0 ? options.maxResults : Number.POSITIVE_INFINITY;

  for (const file of files) {
    if (options.isCancellationRequested?.()) {
      return { matches: results, truncated: false, cancelled: true };
    }

    const content = await readFile(file.absolutePath, "utf8");
    const lines = content.split(/\r?\n/u);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (options.isCancellationRequested?.()) {
        return { matches: results, truncated: false, cancelled: true };
      }

      const line = lines[lineIndex] ?? "";
      const columnNumbers = findMatchColumns(line, trimmedQuery, caseSensitive);

      for (const columnNumber of columnNumbers) {
        results.push({
          absolutePath: file.absolutePath,
          relativePath: file.relativePath,
          lineNumber: lineIndex + 1,
          columnNumber: columnNumber + 1,
          lineText: line.trim(),
          matchLength: trimmedQuery.length
        });

        if (results.length >= maxResults) {
          return { matches: results, truncated: true, cancelled: false };
        }
      }
    }
  }

  return { matches: results, truncated: false, cancelled: false };
}

function hasUppercase(value: string): boolean {
  return value.toLowerCase() !== value;
}

function findMatchColumns(line: string, query: string, caseSensitive: boolean): number[] {
  const haystack = caseSensitive ? line : line.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: number[] = [];
  let startIndex = 0;

  while (startIndex < haystack.length) {
    const foundIndex = haystack.indexOf(needle, startIndex);
    if (foundIndex < 0) {
      break;
    }

    matches.push(foundIndex);
    startIndex = foundIndex + Math.max(needle.length, 1);
  }

  return matches;
}
