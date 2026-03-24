import { basename, dirname, extname, relative } from "node:path";
import { defaultLinkRelatedMemoLimit } from "../config/constants";
import type { MemoIndexedEntry } from "../index/memoIndex";
import { areSameFilePath, normalizeFilePathForComparison } from "../../shared/filePathComparison";
import { findRelatedMemos, type RelatedMemoCandidate } from "./relatedMemos";

export interface MemoLinkCandidate {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly label: string;
  readonly detail: string;
  readonly score: number;
}

type RelatedScoreCache = {
  readonly key: string;
  readonly fingerprint: string;
  readonly timestamp: number;
  readonly scores: ReadonlyMap<string, RelatedMemoCandidate>;
};

let relatedScoreCache: RelatedScoreCache | undefined;

export function clearMemoLinkCandidateCache(): void {
  relatedScoreCache = undefined;
}

export function buildMemoLinkCandidates(
  entries: readonly MemoIndexedEntry[],
  currentMemoPath: string,
  options: {
    readonly query?: string;
    readonly limit?: number;
  } = {}
): readonly MemoLinkCandidate[] {
  const currentEntry = entries.find((entry) => areSameFilePath(entry.absolutePath, currentMemoPath));
  const normalizedQuery = normalizeQuery(options.query ?? "");
  const relatedScores = normalizedQuery === "" && currentEntry ? getRelatedScoreMap(entries, currentMemoPath) : new Map();
  const limit = options.limit ?? 50;

  return entries
    .filter((entry) => !areSameFilePath(entry.absolutePath, currentMemoPath))
    .map((entry) => {
      const related = relatedScores.get(entry.absolutePath);
      const queryScore = scoreQueryMatch(entry, normalizedQuery);
      const relatedScore = related?.score ?? 0;
      const recencyScore = entry.mtime.getTime() / 1_000_000_000_000;
      const score = normalizedQuery === "" ? relatedScore + recencyScore : queryScore * 100 + relatedScore + recencyScore;
      const detailParts = [
        entry.relativePath,
        related?.reasons.length ? related.reasons.join(" | ") : undefined,
        normalizedQuery !== "" && queryScore > 0 ? `Match score: ${queryScore}` : undefined
      ].filter((value): value is string => typeof value === "string" && value.trim() !== "");

      return {
        absolutePath: entry.absolutePath,
        relativePath: entry.relativePath,
        label: getMemoLinkLabel(entry),
        detail: detailParts.join(" | "),
        score
      };
    })
    .filter((candidate) => normalizedQuery === "" || candidate.score >= 100)
    .sort((left, right) => right.score - left.score || left.relativePath.localeCompare(right.relativePath))
    .slice(0, limit);
}

function getRelatedScoreMap(entries: readonly MemoIndexedEntry[], currentMemoPath: string): ReadonlyMap<string, RelatedMemoCandidate> {
  const cacheKey = normalizeFilePathForComparison(currentMemoPath);
  const fingerprint = buildRelatedScoreFingerprint(entries);
  if (
    relatedScoreCache
    && relatedScoreCache.key === cacheKey
    && relatedScoreCache.fingerprint === fingerprint
    && Date.now() - relatedScoreCache.timestamp <= 10_000
  ) {
    return relatedScoreCache.scores as ReadonlyMap<string, RelatedMemoCandidate>;
  }

  const scores = new Map(
    findRelatedMemos(entries, currentMemoPath, defaultLinkRelatedMemoLimit).map((entry) => [entry.absolutePath, entry] as const)
  );
  relatedScoreCache = {
    key: cacheKey,
    fingerprint,
    timestamp: Date.now(),
    scores
  };
  return scores;
}

function buildRelatedScoreFingerprint(entries: readonly MemoIndexedEntry[]): string {
  let latestMtime = 0;
  for (const entry of entries) {
    latestMtime = Math.max(latestMtime, entry.mtime.getTime());
  }

  return `${entries.length}:${latestMtime}`;
}

export function buildRelativeMarkdownMemoLink(
  fromMemoPath: string,
  targetMemoPath: string,
  label: string
): string {
  return `[${escapeMarkdownLinkLabel(label)}](${buildRelativeMemoLinkReference(fromMemoPath, targetMemoPath)})`;
}

export function buildRelativeMemoLinkReference(fromMemoPath: string, targetMemoPath: string): string {
  const rawRelativePath = relative(dirname(fromMemoPath), targetMemoPath).replace(/\\/gu, "/");
  const normalizedRelativePath = rawRelativePath === "" ? basename(targetMemoPath) : rawRelativePath;
  return normalizedRelativePath
    .split("/")
    .map((segment) => {
      if (segment === "." || segment === "..") {
        return segment;
      }

      return encodeURIComponent(segment);
    })
    .join("/");
}

export function getMemoLinkLabel(entry: Pick<MemoIndexedEntry, "relativePath" | "title">): string {
  const title = entry.title?.trim();
  if (title) {
    return title;
  }

  const fileStem = basename(entry.relativePath, extname(entry.relativePath));
  const withoutDatePrefix = fileStem.replace(/^\d{4}-\d{2}-\d{2}[-_ ]*/u, "");
  const normalized = withoutDatePrefix.replace(/[-_]+/gu, " ").trim();
  return normalized || fileStem;
}

function scoreQueryMatch(entry: Pick<MemoIndexedEntry, "relativePath" | "title">, normalizedQuery: string): number {
  if (normalizedQuery === "") {
    return 0;
  }

  const label = getMemoLinkLabel(entry).toLowerCase();
  const path = entry.relativePath.toLowerCase();
  const fileName = basename(entry.relativePath).toLowerCase();
  const fileStem = basename(entry.relativePath, extname(entry.relativePath)).toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/u).filter((token) => token !== "");
  let score = 0;

  if (label === normalizedQuery) {
    score += 12;
  } else if (label.startsWith(normalizedQuery)) {
    score += 9;
  } else if (label.includes(normalizedQuery)) {
    score += 7;
  }

  if (fileName.startsWith(normalizedQuery)) {
    score += 6;
  } else if (fileName.includes(normalizedQuery)) {
    score += 4;
  }

  if (path.includes(normalizedQuery)) {
    score += 3;
  }

  const tokenMatches = queryTokens.filter((token) => label.includes(token) || path.includes(token));
  score += tokenMatches.length * 2;
  score += scoreApproximateMatch(normalizedQuery, label, fileName, fileStem);

  return score;
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function escapeMarkdownLinkLabel(value: string): string {
  return value.replace(/\\/gu, "\\\\").replace(/\[/gu, "\\[").replace(/\]/gu, "\\]").replace(/\r?\n/gu, " ").trim();
}

function scoreApproximateMatch(normalizedQuery: string, label: string, fileName: string, fileStem: string): number {
  if (normalizedQuery.length < 4) {
    return 0;
  }

  const values = [
    label,
    fileName,
    fileStem,
    ...splitSearchableTokens(label),
    ...splitSearchableTokens(fileName),
    ...splitSearchableTokens(fileStem)
  ];

  let bestDistance: number | undefined;
  for (const value of values) {
    const candidateDistance = getApproximateDistance(normalizedQuery, value);
    if (candidateDistance === undefined) {
      continue;
    }

    if (bestDistance === undefined || candidateDistance < bestDistance) {
      bestDistance = candidateDistance;
      if (bestDistance === 0) {
        break;
      }
    }
  }

  if (bestDistance === undefined) {
    return 0;
  }

  if (bestDistance <= 1) {
    return 5;
  }

  if (bestDistance === 2 && normalizedQuery.length >= 6) {
    return 3;
  }

  return 0;
}

function splitSearchableTokens(value: string): readonly string[] {
  return value
    .split(/[^a-z0-9]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function getApproximateDistance(query: string, candidate: string): number | undefined {
  if (candidate.trim() === "") {
    return undefined;
  }

  const maxDistance = query.length >= 6 ? 2 : 1;
  const comparableValues = new Set<string>([candidate]);
  if (candidate.length > query.length) {
    comparableValues.add(candidate.slice(0, query.length));
  }

  let bestDistance: number | undefined;
  for (const comparableValue of comparableValues) {
    const distance = boundedLevenshtein(query, comparableValue, maxDistance);
    if (distance === undefined) {
      continue;
    }

    if (bestDistance === undefined || distance < bestDistance) {
      bestDistance = distance;
    }
  }

  return bestDistance;
}

function boundedLevenshtein(left: string, right: string, maxDistance: number): number | undefined {
  const leftLength = left.length;
  const rightLength = right.length;
  if (Math.abs(leftLength - rightLength) > maxDistance) {
    return undefined;
  }

  let previous = Array.from({ length: rightLength + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    const current = [leftIndex];
    let rowMin = leftIndex;

    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const deleteCost = (previous[rightIndex] ?? Number.POSITIVE_INFINITY) + 1;
      const insertCost = (current[rightIndex - 1] ?? Number.POSITIVE_INFINITY) + 1;
      const substituteCost = (previous[rightIndex - 1] ?? Number.POSITIVE_INFINITY) + substitutionCost;
      const value = Math.min(
        deleteCost,
        insertCost,
        substituteCost
      );
      current[rightIndex] = value;
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > maxDistance) {
      return undefined;
    }

    previous = current;
  }

  const distance = previous[rightLength] ?? Number.POSITIVE_INFINITY;
  return distance <= maxDistance ? distance : undefined;
}
