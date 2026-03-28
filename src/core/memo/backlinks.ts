import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { MemoIndexedEntry } from "../index/memoIndex";
import { areSameFilePath } from "../../shared/filePathComparison";
import { buildRelativeMemoLinkReference, getMemoLinkLabel } from "./memoLinks";

export interface MemoBacklinkMatch {
  readonly sourcePath: string;
  readonly sourceRelativePath: string;
  readonly sourceLabel: string;
  readonly line: number;
  readonly column: number;
  readonly preview: string;
}

export async function findMemoBacklinks(
  entries: readonly MemoIndexedEntry[],
  targetMemoPath: string
): Promise<readonly MemoBacklinkMatch[]> {
  const targetEntry = entries.find((entry) => areSameFilePath(entry.absolutePath, targetMemoPath));
  const targetLabel = targetEntry ? getMemoLinkLabel(targetEntry) : fallbackMemoLabel(targetMemoPath);
  const wikilinkLabels = new Set([
    targetLabel.toLowerCase(),
    basename(targetMemoPath, extname(targetMemoPath)).toLowerCase()
  ]);

  const matches = await Promise.all(
    entries
      .filter((entry) => !areSameFilePath(entry.absolutePath, targetMemoPath))
      .map(async (entry) => {
        const content = await readMemoBacklinkSource(entry.absolutePath);
        if (content === undefined) {
          return [];
        }

        const relativeReference = buildRelativeMemoLinkReference(entry.absolutePath, targetMemoPath);
        return collectBacklinkMatches(content, entry, relativeReference, wikilinkLabels);
      })
  );

  return matches.flat().sort((left, right) =>
    left.sourceRelativePath.localeCompare(right.sourceRelativePath)
    || left.line - right.line
    || left.column - right.column
  );
}

async function readMemoBacklinkSource(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function collectBacklinkMatches(
  content: string,
  entry: MemoIndexedEntry,
  relativeReference: string,
  wikilinkLabels: ReadonlySet<string>
): readonly MemoBacklinkMatch[] {
  const lines = content.split(/\r?\n/u);
  const found: MemoBacklinkMatch[] = [];
  const normalizedRelativeReference = decodeURIComponent(relativeReference).toLowerCase();

  lines.forEach((lineText, lineIndex) => {
    const normalizedLine = lineText.toLowerCase();
    let matched = false;

    const markdownTargetIndex = normalizedLine.indexOf(`](${relativeReference.toLowerCase()}`);
    const decodedTargetIndex = normalizedLine.indexOf(`](${normalizedRelativeReference}`);
    if (markdownTargetIndex >= 0 || decodedTargetIndex >= 0) {
      found.push({
        sourcePath: entry.absolutePath,
        sourceRelativePath: entry.relativePath,
        sourceLabel: getMemoLinkLabel(entry),
        line: lineIndex + 1,
        column: Math.max(markdownTargetIndex, decodedTargetIndex) + 1,
        preview: lineText.trim()
      });
      matched = true;
    }

    if (!matched) {
      const wikiMatch = lineText.match(/\[\[([^\]]+)\]\]/u);
      const wikiLabel = wikiMatch?.[1]?.trim().toLowerCase();
      if (wikiLabel && wikilinkLabels.has(wikiLabel)) {
        found.push({
          sourcePath: entry.absolutePath,
          sourceRelativePath: entry.relativePath,
          sourceLabel: getMemoLinkLabel(entry),
          line: lineIndex + 1,
          column: (wikiMatch?.index ?? 0) + 1,
          preview: lineText.trim()
        });
      }
    }
  });

  return found;
}

function fallbackMemoLabel(targetMemoPath: string): string {
  return basename(targetMemoPath, extname(targetMemoPath)).replace(/^\d{4}-\d{2}-\d{2}[-_ ]*/u, "").trim();
}
