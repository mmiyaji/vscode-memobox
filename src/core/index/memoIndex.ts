import { readFile, readdir, rm, stat } from "node:fs/promises";
import { basename, extname, join, normalize, relative } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { getPersistentBackupFilePath, getTransientBackupFilePath, writeFileSafely } from "../../shared/safeWrite";
import { extractMemoFrontmatterMetadata } from "../memo/frontmatter";

export interface MemoIndexedEntry {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly birthtime: Date;
  readonly mtime: Date;
  readonly size: number;
  readonly title?: string;
  readonly tags: readonly string[];
}

type MemoIndexedEntrySnapshot = MemoIndexedEntry & {
  readonly mtimeMs: number;
};

const memoIndexCache = new Map<string, MemoIndex>();

type PersistedIndexData = {
  readonly version: 1 | 2;
  readonly memodir: string;
  readonly entries: readonly PersistedIndexEntry[];
};

type PersistedIndexEntry = {
  readonly relativePath: string;
  readonly birthtimeMs: number;
  readonly mtimeMs: number;
  readonly size: number;
  readonly title?: string;
  readonly tags?: readonly string[];
};

export interface MemoIndexRefreshReport {
  readonly entries: readonly MemoIndexedEntry[];
  readonly scannedFiles: number;
  readonly skippedFiles: number;
}

export type MemoIndexLoadSource = "primary" | "backup" | "transient" | "none";

export interface MemoIndexStorageState {
  readonly primaryPath: string;
  readonly backupPath: string;
  readonly transientBackupPath: string;
  readonly primaryExists: boolean;
  readonly backupExists: boolean;
  readonly transientBackupExists: boolean;
  readonly loadSource: MemoIndexLoadSource;
}

export async function getMemoIndexEntries(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  return (await getMemoIndexReport(settings)).entries;
}

export async function getMemoIndexReport(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
  const cacheKey = buildCacheKey(settings);
  let index = memoIndexCache.get(cacheKey);

  if (!index) {
    index = new MemoIndex();
    memoIndexCache.set(cacheKey, index);
  }

  return index.refresh(settings);
}

export async function refreshMemoIndex(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  return (await refreshMemoIndexReport(settings)).entries;
}

export async function refreshMemoIndexReport(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
  memoIndexCache.delete(buildCacheKey(settings));
  return await getMemoIndexReport(settings);
}

export function clearMemoIndexCache(): void {
  memoIndexCache.clear();
}

export async function clearMemoIndexStorage(settings: MemoBoxSettings): Promise<number> {
  clearMemoIndexCache();

  const candidatePaths = [
    getIndexFilePath(settings),
    getIndexBackupFilePath(settings),
    getTransientBackupFilePath(getIndexFilePath(settings))
  ];

  let removedFiles = 0;
  for (const candidatePath of candidatePaths) {
    const existed = await isExistingFile(candidatePath);
    try {
      await rm(candidatePath, { force: true });
      if (existed) {
        removedFiles += 1;
      }
    } catch {
      // Ignore and let callers decide whether to continue with a rebuild.
    }
  }

  return removedFiles;
}

export async function getMemoIndexStorageState(settings: MemoBoxSettings): Promise<MemoIndexStorageState> {
  const primaryPath = getIndexFilePath(settings);
  const backupPath = getIndexBackupFilePath(settings);
  const transientBackupPath = getTransientBackupFilePath(primaryPath);
  const cachedIndex = memoIndexCache.get(buildCacheKey(settings));

  return {
    primaryPath,
    backupPath,
    transientBackupPath,
    primaryExists: await isExistingFile(primaryPath),
    backupExists: await isExistingFile(backupPath),
    transientBackupExists: await isExistingFile(transientBackupPath),
    loadSource: cachedIndex ? cachedIndex.getLastLoadSource() : await inferMemoIndexLoadSource(settings)
  };
}

class MemoIndex {
  private readonly entries = new Map<string, MemoIndexedEntrySnapshot>();
  private loadedFromDisk = false;
  private needsRecoverySave = false;
  private lastLoadSource: MemoIndexLoadSource = "none";

  async refresh(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
    if (!this.loadedFromDisk) {
      await this.load(settings);
    }

    const absolutePaths = await collectMemoFiles(settings.memodir, settings);
    const nextEntries = new Map<string, MemoIndexedEntrySnapshot>();
    let changed = false;
    let skippedFiles = 0;

    for (const absolutePath of absolutePaths) {
      let fileStat;
      try {
        fileStat = await stat(absolutePath);
      } catch {
        changed = true;
        skippedFiles += 1;
        continue;
      }

      const relativePath = normalizeRelativePath(settings.memodir, absolutePath);
      const existing = this.entries.get(relativePath);

      if (existing && existing.mtimeMs === fileStat.mtimeMs && existing.size === fileStat.size) {
        nextEntries.set(relativePath, existing);
        continue;
      }

      changed = true;
      let metadata;
      try {
        metadata = extractMemoFrontmatterMetadata(await readFile(absolutePath, "utf8"));
      } catch {
        skippedFiles += 1;
        continue;
      }

      nextEntries.set(relativePath, {
        absolutePath,
        relativePath,
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
        title: metadata.title,
        tags: metadata.tags
      });
    }

    if (this.entries.size !== nextEntries.size) {
      changed = true;
    } else {
      for (const relativePath of this.entries.keys()) {
        if (!nextEntries.has(relativePath)) {
          changed = true;
          break;
        }
      }
    }

    this.entries.clear();
    for (const [relativePath, entry] of nextEntries) {
      this.entries.set(relativePath, entry);
    }

    if (changed || this.needsRecoverySave) {
      await this.save(settings);
    }

    return {
      entries: Array.from(this.entries.values()),
      scannedFiles: absolutePaths.length,
      skippedFiles
    };
  }

  private async load(settings: MemoBoxSettings): Promise<void> {
    this.loadedFromDisk = true;
    const recovered = await readPersistedIndexData(settings);
    if (!recovered) {
      this.lastLoadSource = "none";
      return;
    }

    this.needsRecoverySave = recovered.sourcePath !== getIndexFilePath(settings);
    this.lastLoadSource = recovered.sourceKind;

    for (const entry of recovered.data.entries) {
      if (
        typeof entry.relativePath !== "string" ||
        typeof entry.birthtimeMs !== "number" ||
        typeof entry.mtimeMs !== "number" ||
        typeof entry.size !== "number"
      ) {
        continue;
      }

      const absolutePath = normalize(join(settings.memodir, entry.relativePath));
      this.entries.set(entry.relativePath, {
        absolutePath,
        relativePath: entry.relativePath,
        birthtime: new Date(entry.birthtimeMs),
        mtime: new Date(entry.mtimeMs),
        mtimeMs: entry.mtimeMs,
        size: entry.size,
        title: typeof entry.title === "string" && entry.title.trim() !== "" ? entry.title.trim() : undefined,
        tags: Array.isArray(entry.tags)
          ? entry.tags.filter((tag: unknown): tag is string => typeof tag === "string" && tag.trim() !== "")
          : []
      });
    }
  }

  private async save(settings: MemoBoxSettings): Promise<void> {
    const data: PersistedIndexData = {
      version: 2,
      memodir: normalize(settings.memodir),
      entries: Array.from(this.entries.values()).map((entry) => ({
        relativePath: entry.relativePath,
        birthtimeMs: entry.birthtime.getTime(),
        mtimeMs: entry.mtimeMs,
        size: entry.size,
        title: entry.title,
        tags: [...entry.tags]
      }))
    };

    const json = JSON.stringify(data, null, 2);
    await writeFileSafely(getIndexFilePath(settings), json);
    await writeFileSafely(getIndexBackupFilePath(settings), json);
    this.needsRecoverySave = false;
  }

  getLastLoadSource(): MemoIndexLoadSource {
    return this.lastLoadSource;
  }
}

async function collectMemoFiles(directory: string, settings: MemoBoxSettings): Promise<string[]> {
  return await collectMemoFilesAtDepth(directory, settings, 0);
}

async function collectMemoFilesAtDepth(directory: string, settings: MemoBoxSettings, currentDepth: number): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const collected: string[] = [];

  for (const entry of entries) {
    const absolutePath = normalize(join(directory, entry.name));

    if (entry.isDirectory()) {
      if (entry.isSymbolicLink() || shouldSkipDirectory(entry.name, settings)) {
        continue;
      }

      if (currentDepth >= settings.maxScanDepth) {
        continue;
      }

      collected.push(...await collectMemoFilesAtDepth(absolutePath, settings, currentDepth + 1));
      continue;
    }

    if (entry.isFile() && shouldIncludeFile(entry.name, settings)) {
      collected.push(absolutePath);
    }
  }

  return collected;
}

function shouldSkipDirectory(name: string, settings: MemoBoxSettings): boolean {
  const normalizedName = name.trim().toLowerCase();
  return normalizedName === settings.metaDir.toLowerCase()
    || normalizedName.startsWith(".")
    || settings.excludeDirectories.includes(normalizedName);
}

function shouldIncludeFile(name: string, settings: MemoBoxSettings): boolean {
  const extension = extname(name).replace(/^\./, "").toLowerCase();
  return settings.listDisplayExtname.includes(extension);
}

function normalizeRelativePath(rootDir: string, absolutePath: string): string {
  return relative(rootDir, absolutePath).replace(/\\/g, "/");
}

function buildCacheKey(settings: MemoBoxSettings): string {
  return [
    normalize(settings.memodir),
    settings.metaDir,
    [...settings.listDisplayExtname].sort().join(",")
  ].join("::");
}

export function buildMemoListLabel(relativePath: string): string {
  return relativePath === "" ? basename(relativePath) : relativePath;
}

export function getIndexFilePath(settings: MemoBoxSettings): string {
  return normalize(join(settings.memodir, settings.metaDir, "index.json"));
}

export function getIndexBackupFilePath(settings: MemoBoxSettings): string {
  return getPersistentBackupFilePath(getIndexFilePath(settings));
}

async function readPersistedIndexData(
  settings: MemoBoxSettings
): Promise<{ readonly data: PersistedIndexData; readonly sourcePath: string; readonly sourceKind: MemoIndexLoadSource } | undefined> {
  const primaryPath = getIndexFilePath(settings);
  const candidatePaths: readonly { path: string; sourceKind: MemoIndexLoadSource }[] = [
    { path: primaryPath, sourceKind: "primary" },
    { path: getIndexBackupFilePath(settings), sourceKind: "backup" },
    { path: getTransientBackupFilePath(primaryPath), sourceKind: "transient" }
  ];

  for (const candidate of candidatePaths) {
    try {
      const raw = await readFile(candidate.path, "utf8");
      const parsed = JSON.parse(raw) as PersistedIndexData;

      if (![1, 2].includes(parsed.version) || parsed.memodir !== normalize(settings.memodir) || !Array.isArray(parsed.entries)) {
        continue;
      }

      return {
        data: parsed,
        sourcePath: candidate.path,
        sourceKind: candidate.sourceKind
      };
    } catch {
      // Try the next recovery source.
    }
  }

  return undefined;
}

async function inferMemoIndexLoadSource(settings: MemoBoxSettings): Promise<MemoIndexLoadSource> {
  const recovered = await readPersistedIndexData(settings);
  return recovered?.sourceKind ?? "none";
}

async function isExistingFile(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}
