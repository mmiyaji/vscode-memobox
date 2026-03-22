import { format } from "date-fns";
import type { MemoIndexedEntry } from "../index/memoIndex";

export type MemoGrepScope =
  | { readonly kind: "all" }
  | { readonly kind: "year"; readonly prefix: string }
  | { readonly kind: "month"; readonly prefix: string }
  | { readonly kind: "subfolder"; readonly prefix: string };

export interface MemoGrepScopeOption {
  readonly label: string;
  readonly description: string;
  readonly scope: MemoGrepScope;
}

export function createDefaultGrepScopes(now: Date = new Date()): readonly MemoGrepScopeOption[] {
  return [
    {
      label: "All memos",
      description: "Search the full memo tree",
      scope: { kind: "all" }
    },
    {
      label: "This year",
      description: format(now, "yyyy"),
      scope: { kind: "year", prefix: `${format(now, "yyyy")}/` }
    },
    {
      label: "This month",
      description: format(now, "yyyy/MM"),
      scope: { kind: "month", prefix: `${format(now, "yyyy/MM")}/` }
    }
  ];
}

export function filterEntriesByGrepScope(
  entries: readonly MemoIndexedEntry[],
  scope: MemoGrepScope
): readonly MemoIndexedEntry[] {
  switch (scope.kind) {
    case "all":
      return entries;
    case "year":
    case "month":
    case "subfolder":
      return entries.filter((entry) => entry.relativePath.startsWith(scope.prefix));
    default:
      return entries;
  }
}

export function listIndexedDirectories(entries: readonly Pick<MemoIndexedEntry, "relativePath">[]): readonly string[] {
  const directories = new Set<string>();

  for (const entry of entries) {
    const slashIndex = entry.relativePath.lastIndexOf("/");
    if (slashIndex <= 0) {
      continue;
    }

    const directory = entry.relativePath.slice(0, slashIndex);
    directories.add(directory);
  }

  return Array.from(directories).sort((left, right) => left.localeCompare(right));
}
