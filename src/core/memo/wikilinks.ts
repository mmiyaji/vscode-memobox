import { basename, extname } from "node:path";
import type { MemoIndexedEntry } from "../index/memoIndex";
import { areSameFilePath } from "../../shared/filePathComparison";
import { getMemoLinkLabel } from "./memoLinks";

export interface WikiLinkTarget {
  readonly query: string;
  readonly startCharacter: number;
  readonly endCharacter: number;
}

export function detectWikiLinkAtPosition(lineText: string, character: number): WikiLinkTarget | undefined {
  const wikiLinkPattern = /\[\[([^\]]*)\]?\]?/gu;

  for (const match of lineText.matchAll(wikiLinkPattern)) {
    const fullMatch = match[0];
    const query = match[1] ?? "";
    const startCharacter = match.index ?? 0;
    const endCharacter = startCharacter + fullMatch.length;
    if (character >= startCharacter && character <= endCharacter) {
      return {
        query,
        startCharacter,
        endCharacter
      };
    }
  }

  return undefined;
}

export function findExactMemoByWikiLabel(
  entries: readonly MemoIndexedEntry[],
  currentMemoPath: string,
  query: string
): MemoIndexedEntry | undefined {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") {
    return undefined;
  }

  return entries.find((entry) => {
    if (areSameFilePath(entry.absolutePath, currentMemoPath)) {
      return false;
    }

    const candidates = [
      getMemoLinkLabel(entry),
      basename(entry.relativePath, extname(entry.relativePath)),
      entry.title ?? ""
    ]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value !== "");

    return candidates.includes(normalizedQuery);
  });
}
