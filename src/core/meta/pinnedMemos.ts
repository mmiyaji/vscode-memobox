import { readFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { getPersistentBackupFilePath, getTransientBackupFilePath, writeFileSafely } from "../../shared/safeWrite";

type PersistedPinnedMemos = {
  readonly version: 1;
  readonly pinnedRelativePaths: readonly string[];
};

export async function readPinnedMemoRelativePaths(settings: MemoBoxSettings): Promise<readonly string[]> {
  const recovered = await readPinnedMemoData(settings);
  if (!recovered) {
    return [];
  }

  const normalized = recovered.data.pinnedRelativePaths.filter(
    (value): value is string => typeof value === "string" && value.trim() !== ""
  );

  if (recovered.sourcePath !== getPinnedMemosFilePath(settings)) {
    await persistPinnedMemoRelativePaths(settings, normalized);
  }

  return normalized;
}

export async function writePinnedMemoRelativePaths(
  settings: MemoBoxSettings,
  relativePaths: readonly string[]
): Promise<void> {
  const uniquePaths = Array.from(new Set(relativePaths.map((value) => value.trim()).filter((value) => value !== "")));
  await persistPinnedMemoRelativePaths(settings, uniquePaths);
}

async function persistPinnedMemoRelativePaths(
  settings: MemoBoxSettings,
  relativePaths: readonly string[]
): Promise<void> {
  const data: PersistedPinnedMemos = {
    version: 1,
    pinnedRelativePaths: relativePaths
  };

  const json = JSON.stringify(data, null, 2);
  await writeFileSafely(getPinnedMemosFilePath(settings), json);
  await writeFileSafely(getPinnedMemosBackupFilePath(settings), json);
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

export function getPinnedMemosBackupFilePath(settings: MemoBoxSettings): string {
  return getPersistentBackupFilePath(getPinnedMemosFilePath(settings));
}

function toRelativeMemoPath(settings: MemoBoxSettings, absolutePath: string): string {
  return relative(settings.memodir, absolutePath).replace(/\\/g, "/");
}

async function readPinnedMemoData(
  settings: MemoBoxSettings
): Promise<{ readonly data: PersistedPinnedMemos; readonly sourcePath: string } | undefined> {
  const primaryPath = getPinnedMemosFilePath(settings);
  const candidatePaths = [
    primaryPath,
    getPinnedMemosBackupFilePath(settings),
    getTransientBackupFilePath(primaryPath)
  ];

  for (const candidatePath of candidatePaths) {
    try {
      const raw = await readFile(candidatePath, "utf8");
      const parsed = JSON.parse(raw) as PersistedPinnedMemos;

      if (parsed.version !== 1 || !Array.isArray(parsed.pinnedRelativePaths)) {
        continue;
      }

      return {
        data: parsed,
        sourcePath: candidatePath
      };
    } catch {
      // Try the next recovery source.
    }
  }

  return undefined;
}
