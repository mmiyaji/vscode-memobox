import { readFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { writeFileSafely } from "../../shared/safeWrite";

type PersistedPinnedMemos = {
  readonly version: 1;
  readonly pinnedRelativePaths: readonly string[];
};

export async function readPinnedMemoRelativePaths(settings: MemoBoxSettings): Promise<readonly string[]> {
  try {
    const raw = await readFile(getPinnedMemosFilePath(settings), "utf8");
    const parsed = JSON.parse(raw) as PersistedPinnedMemos;

    if (parsed.version !== 1 || !Array.isArray(parsed.pinnedRelativePaths)) {
      return [];
    }

    return parsed.pinnedRelativePaths.filter((value): value is string => typeof value === "string" && value.trim() !== "");
  } catch {
    return [];
  }
}

export async function writePinnedMemoRelativePaths(
  settings: MemoBoxSettings,
  relativePaths: readonly string[]
): Promise<void> {
  const uniquePaths = Array.from(new Set(relativePaths.map((value) => value.trim()).filter((value) => value !== "")));
  const data: PersistedPinnedMemos = {
    version: 1,
    pinnedRelativePaths: uniquePaths
  };

  await writeFileSafely(getPinnedMemosFilePath(settings), JSON.stringify(data, null, 2));
}

export async function pinMemoByAbsolutePath(settings: MemoBoxSettings, absolutePath: string): Promise<void> {
  const current = await readPinnedMemoRelativePaths(settings);
  const relativePath = toRelativeMemoPath(settings, absolutePath);

  await writePinnedMemoRelativePaths(settings, [relativePath, ...current]);
}

export async function unpinMemoByAbsolutePath(settings: MemoBoxSettings, absolutePath: string): Promise<void> {
  const current = await readPinnedMemoRelativePaths(settings);
  const relativePath = toRelativeMemoPath(settings, absolutePath);

  await writePinnedMemoRelativePaths(
    settings,
    current.filter((value) => value !== relativePath)
  );
}

export function getPinnedMemosFilePath(settings: MemoBoxSettings): string {
  return normalize(join(settings.memodir, settings.metaDir, "pinned-memos.json"));
}

function toRelativeMemoPath(settings: MemoBoxSettings, absolutePath: string): string {
  return relative(settings.memodir, absolutePath).replace(/\\/g, "/");
}
