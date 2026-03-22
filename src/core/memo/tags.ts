import type { MemoIndexedEntry } from "../index/memoIndex";

export interface MemoTagSummary {
  readonly tag: string;
  readonly count: number;
}

export function buildMemoTagSummaries(
  entries: readonly Pick<MemoIndexedEntry, "tags">[],
  limit?: number
): readonly MemoTagSummary[] {
  const counts = new Map<string, { displayTag: string; count: number }>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const normalized = tag.toLowerCase();
      const current = counts.get(normalized);
      if (current) {
        current.count += 1;
        continue;
      }

      counts.set(normalized, { displayTag: tag, count: 1 });
    }
  }

  const rows = Array.from(counts.values())
    .map((entry) => ({
      tag: entry.displayTag,
      count: entry.count
    }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function filterEntriesByTag<T extends Pick<MemoIndexedEntry, "tags">>(
  entries: readonly T[],
  tag: string
): readonly T[] {
  const normalized = tag.trim().toLowerCase();
  if (normalized === "") {
    return [];
  }

  return entries.filter((entry) => entry.tags.some((entryTag) => entryTag.toLowerCase() === normalized));
}
