import { readFile, readdir, rm, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, join, normalize, relative } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { defaultIndexFullRescanIntervalMs } from "../config/constants";
import { getPersistentBackupFilePath, getTransientBackupFilePath, writeFileSafely } from "../../shared/safeWrite";
import { logMemoBoxInfo, logMemoBoxWarn } from "../../shared/logging";
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

type MemoIndexChange =
  | {
      readonly kind: "upsert";
      readonly filePath: string;
    }
  | {
      readonly kind: "delete";
      readonly filePath: string;
    };

export async function getMemoIndexEntries(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  return (await getMemoIndexReport(settings)).entries;
}

export async function getMemoIndexReport(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
  return (await getOrCreateMemoIndex(settings)).refresh(settings);
}

export async function refreshMemoIndex(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  return (await refreshMemoIndexReport(settings)).entries;
}

export async function refreshMemoIndexReport(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
  const index = await getOrCreateMemoIndex(settings);
  index.markDirtyForFullRefresh();
  return await index.refresh(settings, { force: true });
}

export function clearMemoIndexCache(): void {
  memoIndexCache.clear();
}

export function markMemoIndexDirtyForPath(filePath: string): void {
  const normalizedFilePath = normalize(filePath);
  for (const index of memoIndexCache.values()) {
    if (index.isRelevantPath(normalizedFilePath)) {
      index.markDirtyForFullRefresh();
    }
  }
}

export function markAllMemoIndexesDirty(): void {
  for (const index of memoIndexCache.values()) {
    index.markDirtyForFullRefresh();
  }
}

export function noteMemoIndexFileUpsert(filePath: string): void {
  const normalizedFilePath = normalize(filePath);
  for (const index of memoIndexCache.values()) {
    if (index.isRelevantPath(normalizedFilePath)) {
      index.enqueueChange({
        kind: "upsert",
        filePath: normalizedFilePath
      });
    }
  }
}

export function noteMemoIndexFileDelete(filePath: string): void {
  const normalizedFilePath = normalize(filePath);
  for (const index of memoIndexCache.values()) {
    if (index.isRelevantPath(normalizedFilePath)) {
      index.enqueueChange({
        kind: "delete",
        filePath: normalizedFilePath
      });
    }
  }
}

export function noteMemoIndexFileRename(oldFilePath: string, newFilePath: string): void {
  noteMemoIndexFileDelete(oldFilePath);
  noteMemoIndexFileUpsert(newFilePath);
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

  logMemoBoxInfo("index", "Cleared persisted memo index storage.", {
    removedFiles,
    memodir: settings.memodir
  });

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
  private readonly rootDir: string;
  private readonly entries = new Map<string, MemoIndexedEntrySnapshot>();
  private loadedFromDisk = false;
  private needsRecoverySave = false;
  private lastLoadSource: MemoIndexLoadSource = "none";
  private lastRefreshReport: MemoIndexRefreshReport = {
    entries: [],
    scannedFiles: 0,
    skippedFiles: 0
  };
  private lastFullRefreshAt = 0;
  private pendingChanges: MemoIndexChange[] = [];
  private requiresFullRefresh = true;
  private refreshPromise: Promise<MemoIndexRefreshReport> | undefined;

  constructor(rootDir: string) {
    this.rootDir = normalize(rootDir);
  }

  async refresh(settings: MemoBoxSettings, options: { readonly force?: boolean } = {}): Promise<MemoIndexRefreshReport> {
    if (!this.loadedFromDisk) {
      await this.load(settings);
    }

    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    const shouldRunFullRefresh = options.force
      || this.requiresFullRefresh
      || this.shouldRunPeriodicFullRefresh();
    this.refreshPromise = shouldRunFullRefresh
      ? this.performFullRefresh(settings)
      : this.performIncrementalRefresh(settings);
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  enqueueChange(change: MemoIndexChange): void {
    this.pendingChanges.push(change);
  }

  markDirtyForFullRefresh(): void {
    this.requiresFullRefresh = true;
  }

  isRelevantPath(filePath: string): boolean {
    return isPathInsideRoot(this.rootDir, filePath);
  }

  private shouldRunPeriodicFullRefresh(): boolean {
    return this.lastFullRefreshAt > 0
      && Date.now() - this.lastFullRefreshAt >= defaultIndexFullRescanIntervalMs;
  }

  private async performFullRefresh(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
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

    const report: MemoIndexRefreshReport = {
      entries: Array.from(this.entries.values()),
      scannedFiles: absolutePaths.length,
      skippedFiles
    };
    this.lastRefreshReport = report;
    this.lastFullRefreshAt = Date.now();
    this.pendingChanges = [];
    this.requiresFullRefresh = false;
    return report;
  }

  private async performIncrementalRefresh(settings: MemoBoxSettings): Promise<MemoIndexRefreshReport> {
    if (this.pendingChanges.length === 0 && !this.needsRecoverySave) {
      return this.lastRefreshReport;
    }

    const pendingChanges = this.pendingChanges;
    this.pendingChanges = [];

    let changed = false;
    let skippedFiles = 0;
    let scannedFiles = 0;

    for (const change of pendingChanges) {
      if (change.kind === "delete") {
        changed = this.deleteEntryForFilePath(change.filePath) || changed;
        continue;
      }

      scannedFiles += 1;
      const outcome = await this.upsertEntryForFilePath(settings, change.filePath);
      changed = outcome.changed || changed;
      skippedFiles += outcome.skippedFiles;
    }

    if (changed || this.needsRecoverySave) {
      await this.save(settings);
    }

    const report: MemoIndexRefreshReport = {
      entries: Array.from(this.entries.values()),
      scannedFiles,
      skippedFiles
    };
    this.lastRefreshReport = report;
    this.requiresFullRefresh = false;
    return report;
  }

  private deleteEntryForFilePath(filePath: string): boolean {
    const relativePath = tryNormalizeIndexedRelativePath(this.rootDir, filePath);
    if (!relativePath) {
      return false;
    }

    return this.entries.delete(relativePath);
  }

  private async upsertEntryForFilePath(
    settings: MemoBoxSettings,
    filePath: string
  ): Promise<{ readonly changed: boolean; readonly skippedFiles: number }> {
    const relativePath = tryNormalizeIndexedRelativePath(this.rootDir, filePath);
    if (!relativePath || !shouldIncludeFile(basename(filePath), settings) || shouldSkipRelativeDirectory(relativePath, settings)) {
      return {
        changed: this.deleteEntryForFilePath(filePath),
        skippedFiles: 0
      };
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      return {
        changed: this.deleteEntryForFilePath(filePath),
        skippedFiles: 1
      };
    }

    const existing = this.entries.get(relativePath);
    if (existing && existing.mtimeMs === fileStat.mtimeMs && existing.size === fileStat.size) {
      return {
        changed: false,
        skippedFiles: 0
      };
    }

    let metadata;
    try {
      metadata = extractMemoFrontmatterMetadata(await readFile(filePath, "utf8"));
    } catch {
      return {
        changed: false,
        skippedFiles: 1
      };
    }

    this.entries.set(relativePath, {
      absolutePath: filePath,
      relativePath,
      birthtime: fileStat.birthtime,
      mtime: fileStat.mtime,
      mtimeMs: fileStat.mtimeMs,
      size: fileStat.size,
      title: metadata.title,
      tags: metadata.tags
    });

    return {
      changed: true,
      skippedFiles: 0
    };
  }

  private async load(settings: MemoBoxSettings): Promise<void> {
    this.loadedFromDisk = true;
    const recovered = await readPersistedIndexData(settings);
    if (!recovered) {
      this.lastLoadSource = "none";
      logMemoBoxInfo("index", "No persisted memo index was available.", {
        memodir: settings.memodir
      });
      return;
    }

    this.needsRecoverySave = recovered.sourcePath !== getIndexFilePath(settings);
    this.lastLoadSource = recovered.sourceKind;

    if (recovered.sourceKind !== "primary") {
      logMemoBoxWarn("index", "Loaded persisted memo index from a recovery source.", {
        sourceKind: recovered.sourceKind,
        sourcePath: recovered.sourcePath
      });
    } else {
      logMemoBoxInfo("index", "Loaded persisted memo index.", {
        sourceKind: recovered.sourceKind,
        entryCount: recovered.data.entries.length
      });
    }

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

    this.lastRefreshReport = {
      entries: Array.from(this.entries.values()),
      scannedFiles: this.entries.size,
      skippedFiles: 0
    };
    this.lastFullRefreshAt = Date.now();
    this.requiresFullRefresh = false;
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
    logMemoBoxInfo("index", "Saved persisted memo index.", {
      entryCount: data.entries.length,
      memodir: settings.memodir
    });
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

function shouldSkipRelativeDirectory(relativePath: string, settings: MemoBoxSettings): boolean {
  const parts = relativePath.split("/").slice(0, -1).map((part) => part.trim().toLowerCase());
  return parts.some((part) => shouldSkipDirectory(part, settings));
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

async function getOrCreateMemoIndex(settings: MemoBoxSettings): Promise<MemoIndex> {
  const cacheKey = buildCacheKey(settings);
  let index = memoIndexCache.get(cacheKey);

  if (!index) {
    index = new MemoIndex(settings.memodir);
    memoIndexCache.set(cacheKey, index);
  }

  return index;
}

function isPathInsideRoot(rootDir: string, filePath: string): boolean {
  const relativePath = relative(rootDir, normalize(filePath));
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function tryNormalizeIndexedRelativePath(rootDir: string, filePath: string): string | undefined {
  if (!isPathInsideRoot(rootDir, filePath)) {
    return undefined;
  }

  return normalizeRelativePath(rootDir, filePath);
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

  logMemoBoxWarn("index", "Failed to read any persisted memo index source.", {
    memodir: settings.memodir
  });

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
