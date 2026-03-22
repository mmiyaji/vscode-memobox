import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join, normalize, relative } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { writeFileSafely } from "../../shared/safeWrite";
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

export async function getMemoIndexEntries(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  const cacheKey = buildCacheKey(settings);
  let index = memoIndexCache.get(cacheKey);

  if (!index) {
    index = new MemoIndex();
    memoIndexCache.set(cacheKey, index);
  }

  return index.refresh(settings);
}

export async function refreshMemoIndex(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
  memoIndexCache.delete(buildCacheKey(settings));
  return await getMemoIndexEntries(settings);
}

export function clearMemoIndexCache(): void {
  memoIndexCache.clear();
}

class MemoIndex {
  private readonly entries = new Map<string, MemoIndexedEntrySnapshot>();
  private loadedFromDisk = false;

  async refresh(settings: MemoBoxSettings): Promise<readonly MemoIndexedEntry[]> {
    if (!this.loadedFromDisk) {
      await this.load(settings);
    }

    const absolutePaths = await collectMemoFiles(settings.memodir, settings);
    const nextEntries = new Map<string, MemoIndexedEntrySnapshot>();
    let changed = false;

    for (const absolutePath of absolutePaths) {
      const fileStat = await stat(absolutePath);
      const relativePath = normalizeRelativePath(settings.memodir, absolutePath);
      const existing = this.entries.get(relativePath);

      if (existing && existing.mtimeMs === fileStat.mtimeMs && existing.size === fileStat.size) {
        nextEntries.set(relativePath, existing);
        continue;
      }

      changed = true;
      const metadata = extractMemoFrontmatterMetadata(await readFile(absolutePath, "utf8"));
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

    if (changed) {
      await this.save(settings);
    }

    return Array.from(this.entries.values());
  }

  private async load(settings: MemoBoxSettings): Promise<void> {
    this.loadedFromDisk = true;

    try {
      const raw = await readFile(getIndexFilePath(settings), "utf8");
      const parsed = JSON.parse(raw) as PersistedIndexData;

      if (![1, 2].includes(parsed.version) || parsed.memodir !== normalize(settings.memodir) || !Array.isArray(parsed.entries)) {
        return;
      }

      for (const entry of parsed.entries) {
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
    } catch {
      // Ignore missing or invalid persisted indexes and rebuild from disk.
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

    await writeFileSafely(getIndexFilePath(settings), JSON.stringify(data, null, 2));
  }
}

async function collectMemoFiles(directory: string, settings: MemoBoxSettings): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const collected: string[] = [];

  for (const entry of entries) {
    const absolutePath = normalize(join(directory, entry.name));

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name, settings)) {
        continue;
      }

      collected.push(...await collectMemoFiles(absolutePath, settings));
      continue;
    }

    if (entry.isFile() && shouldIncludeFile(entry.name, settings)) {
      collected.push(absolutePath);
    }
  }

  return collected;
}

function shouldSkipDirectory(name: string, settings: MemoBoxSettings): boolean {
  return name === settings.metaDir || name.startsWith(".");
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
