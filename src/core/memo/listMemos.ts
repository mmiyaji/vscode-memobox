import { format } from "date-fns";
import type { MemoBoxSettings } from "../config/types";
import { buildMemoListLabel, getMemoIndexEntries } from "../index/memoIndex";

export interface MemoListEntry {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly birthtime: Date;
  readonly mtime: Date;
}

export async function listMemos(settings: MemoBoxSettings): Promise<readonly MemoListEntry[]> {
  const entries = await getMemoIndexEntries(settings);

  return sortEntries(entries, settings.listSortOrder);
}

export function buildMemoListDetail(
  entry: Pick<MemoListEntry, "birthtime" | "mtime">,
  settings: Pick<MemoBoxSettings, "displayFileBirthTime">
): string {
  if (!settings.displayFileBirthTime) {
    return `Modified ${format(entry.mtime, "yyyy-MM-dd HH:mm")}`;
  }

  return `Created ${format(entry.birthtime, "yyyy-MM-dd HH:mm")} | Modified ${format(entry.mtime, "yyyy-MM-dd HH:mm")}`;
}

function sortEntries(entries: readonly MemoListEntry[], order: MemoBoxSettings["listSortOrder"]): MemoListEntry[] {
  const sorted = [...entries];

  switch (order) {
    case "birthtime":
      return sorted.sort((left, right) => right.birthtime.getTime() - left.birthtime.getTime());
    case "mtime":
      return sorted.sort((left, right) => right.mtime.getTime() - left.mtime.getTime());
    case "filename":
    default:
      return sorted.sort((left, right) => compareDescending(left.absolutePath, right.absolutePath));
  }
}

function compareDescending(left: string, right: string): number {
  return left === right ? 0 : left < right ? 1 : -1;
}
export { buildMemoListLabel };
