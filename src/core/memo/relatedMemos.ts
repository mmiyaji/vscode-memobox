import { basename, dirname } from "node:path";
import type { MemoIndexedEntry } from "../index/memoIndex";
import { areSameFilePath } from "../../shared/filePathComparison";

export interface RelatedMemoCandidate {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly title?: string;
  readonly score: number;
  readonly reasons: readonly string[];
}

const ignoredTokens = new Set(["memo", "memos", "note", "notes", "daily", "today", "log", "journal", "the", "and"]);

export function findRelatedMemos(
  entries: readonly MemoIndexedEntry[],
  currentMemoPath: string,
  limit = 12
): readonly RelatedMemoCandidate[] {
  const currentEntry = entries.find((entry) => areSameFilePath(entry.absolutePath, currentMemoPath));
  if (!currentEntry) {
    return [];
  }

  const currentTags = new Set(currentEntry.tags.map((tag) => tag.toLowerCase()));
  const currentTokens = collectMemoTokens(currentEntry);
  const currentDate = extractMemoDate(currentEntry.relativePath);
  const currentFolder = normalizeDirectory(dirname(currentEntry.relativePath));

  return entries
    .filter((entry) => !areSameFilePath(entry.absolutePath, currentMemoPath))
    .map((entry) => {
      const sharedTags = entry.tags.filter((tag) => currentTags.has(tag.toLowerCase()));
      const sharedTokens = Array.from(collectMemoTokens(entry)).filter((token) => currentTokens.has(token));
      const reasons: string[] = [];
      let score = 0;

      if (sharedTags.length > 0) {
        score += sharedTags.length * 5;
        reasons.push(`Shared tags: ${sharedTags.slice(0, 3).join(", ")}`);
      }

      if (sharedTokens.length > 0) {
        score += Math.min(sharedTokens.length, 3) * 2;
        reasons.push(`Shared terms: ${sharedTokens.slice(0, 3).join(", ")}`);
      }

      const candidateFolder = normalizeDirectory(dirname(entry.relativePath));
      if (candidateFolder === currentFolder) {
        score += 1;
        reasons.push("Same folder");
      }

      const candidateDate = extractMemoDate(entry.relativePath);
      const proximityLabel = describeDateProximity(currentDate, candidateDate);
      if (proximityLabel) {
        score += proximityLabel.score;
        reasons.push(proximityLabel.label);
      }

      return {
        absolutePath: entry.absolutePath,
        relativePath: entry.relativePath,
        title: entry.title,
        score,
        reasons
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.relativePath.localeCompare(right.relativePath))
    .slice(0, limit);
}

function collectMemoTokens(entry: Pick<MemoIndexedEntry, "relativePath" | "title">): ReadonlySet<string> {
  const fileStem = basename(entry.relativePath).replace(/\.[^.]+$/u, "");
  const source = `${entry.title ?? ""} ${fileStem}`.toLowerCase();
  const tokens = source.match(/[a-z0-9]{3,}/gu) ?? [];
  const normalized = tokens.filter((token) => !ignoredTokens.has(token) && !/^\d+$/u.test(token));
  return new Set(normalized);
}

function extractMemoDate(relativePath: string): Date | undefined {
  const match = basename(relativePath).match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function describeDateProximity(
  currentDate: Date | undefined,
  candidateDate: Date | undefined
): { readonly score: number; readonly label: string } | undefined {
  if (!currentDate || !candidateDate) {
    return undefined;
  }

  const difference = Math.abs(candidateDate.getTime() - currentDate.getTime());
  const days = Math.round(difference / (24 * 60 * 60 * 1000));

  if (days === 0) {
    return { score: 3, label: "Same date" };
  }

  if (days <= 7) {
    return { score: 2, label: `Within ${days} days` };
  }

  if (days <= 31) {
    return { score: 1, label: `Within ${days} days` };
  }

  return undefined;
}

function normalizeDirectory(value: string): string {
  return value.replace(/\\/g, "/");
}
