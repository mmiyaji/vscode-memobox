import { stat } from "node:fs/promises";
import { dirname } from "node:path";
import { format } from "date-fns";
import type { MemoBoxSettings } from "../../core/config/types";
import { getIndexFilePath, getMemoIndexEntries, type MemoIndexedEntry } from "../../core/index/memoIndex";
import {
  getSnippetsDirectory,
  getTemplatesDirectory,
  listSnippetAssets,
  listTemplateAssets
} from "../../core/meta/memoAssets";
import { readPinnedMemoRelativePaths } from "../../core/meta/pinnedMemos";
import { areSameMemoPaths, getMemoDateDirectory, getPreferredTemplatePath, getQuickMemoFilePath } from "../../core/memo/pathing";
import { buildMemoTagSummaries, type MemoTagSummary } from "../../core/memo/tags";
import { getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../../core/meta/memoWorkspace";

export interface AdminDashboardModel {
  readonly version: string;
  readonly generatedAtLabel: string;
  readonly memoRoot: string;
  readonly memoRootReady: boolean;
  readonly workspaceFilePath: string;
  readonly workspaceFileExists: boolean;
  readonly datePathFormat: string;
  readonly metaDir: string;
  readonly locale: string;
  readonly todayDirectory: string;
  readonly todayMemoPath: string;
  readonly templatePath: string;
  readonly hasExplicitTemplateOverride: boolean;
  readonly templatesDirectory: string;
  readonly templatesDirectoryReady: boolean;
  readonly snippetsDirectory: string;
  readonly snippetsDirectoryReady: boolean;
  readonly templates: readonly AdminTemplateAsset[];
  readonly snippets: readonly AdminSnippetAsset[];
  readonly totalFiles: number;
  readonly latestUpdatedAtLabel: string;
  readonly indexFilePath: string;
  readonly indexFileExists: boolean;
  readonly indexFileSizeLabel: string;
  readonly pinnedFiles: readonly AdminMemoFile[];
  readonly recentFiles: readonly AdminRecentFile[];
  readonly folderCounts: readonly AdminCountRow[];
  readonly topTags: readonly MemoTagSummary[];
}

export interface AdminRecentFile extends AdminMemoFile {}

export interface AdminMemoFile {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly parentDirectory: string;
  readonly updatedAtLabel: string;
  readonly isPinned: boolean;
}

export interface AdminCountRow {
  readonly label: string;
  readonly count: number;
}

export interface AdminTemplateAsset {
  readonly absolutePath: string;
  readonly name: string;
  readonly sizeLabel: string;
  readonly updatedAtLabel: string;
  readonly isDefault: boolean;
}

export interface AdminSnippetAsset {
  readonly absolutePath: string;
  readonly name: string;
  readonly sizeLabel: string;
  readonly updatedAtLabel: string;
  readonly snippetCount: number;
  readonly snippetSummaries: readonly string[];
  readonly loadError?: string;
}

export async function buildAdminDashboardModel(
  settings: MemoBoxSettings,
  version: string,
  now: Date = new Date()
): Promise<AdminDashboardModel> {
  const memoRootReady = await isExistingDirectory(settings.memodir);
  const entries = memoRootReady ? await getMemoIndexEntries(settings) : [];
  const pinnedRelativePaths = memoRootReady ? await readPinnedMemoRelativePaths(settings) : [];
  const indexFilePath = settings.memodir.trim() === "" ? "" : getIndexFilePath(settings);
  const indexFileInfo = indexFilePath === "" ? undefined : await readOptionalFileInfo(indexFilePath);
  const templatesDirectory = memoRootReady ? getTemplatesDirectory(settings) : "";
  const snippetsDirectory = memoRootReady ? getSnippetsDirectory(settings) : "";
  const workspaceFilePath = settings.memodir.trim() === ""
    ? ""
    : getMemoWorkspaceFilePath(settings.memodir, `${getDefaultWorkspaceName()}.code-workspace`);
  const workspaceFileInfo = workspaceFilePath === "" ? undefined : await readOptionalFileInfo(workspaceFilePath);
  const templateAssets = memoRootReady ? await listTemplateAssets(settings) : [];
  const snippetAssets = memoRootReady ? await listSnippetAssets(settings) : [];
  const templatesDirectoryReady = memoRootReady ? await isExistingDirectory(templatesDirectory) : false;
  const snippetsDirectoryReady = memoRootReady ? await isExistingDirectory(snippetsDirectory) : false;

  return {
    version,
    generatedAtLabel: format(now, "yyyy-MM-dd HH:mm"),
    memoRoot: settings.memodir.trim(),
    memoRootReady,
    workspaceFilePath,
    workspaceFileExists: workspaceFileInfo?.exists ?? false,
    datePathFormat: settings.datePathFormat,
    metaDir: settings.metaDir,
    locale: settings.locale,
    todayDirectory: memoRootReady ? getMemoDateDirectory(settings, now) : "",
    todayMemoPath: memoRootReady ? getQuickMemoFilePath(settings, now) : "",
    templatePath: memoRootReady ? getPreferredTemplatePath(settings) : "",
    hasExplicitTemplateOverride: settings.memotemplate.trim() !== "",
    templatesDirectory,
    templatesDirectoryReady,
    snippetsDirectory,
    snippetsDirectoryReady,
    templates: buildAdminTemplateAssets(templateAssets, settings),
    snippets: buildAdminSnippetAssets(snippetAssets),
    totalFiles: entries.length,
    latestUpdatedAtLabel: getLatestUpdatedAtLabel(entries),
    indexFilePath,
    indexFileExists: indexFileInfo?.exists ?? false,
    indexFileSizeLabel: indexFileInfo ? formatFileSize(indexFileInfo.size) : "not created",
    pinnedFiles: buildPinnedAdminFiles(entries, pinnedRelativePaths),
    recentFiles: buildAdminRecentFiles(entries, pinnedRelativePaths, settings.recentCount),
    folderCounts: buildAdminFolderCounts(entries),
    topTags: buildMemoTagSummaries(entries, 10)
  };
}

export function buildAdminRecentFiles(
  entries: readonly MemoIndexedEntry[],
  pinnedRelativePaths: readonly string[] = [],
  limit = 8
): readonly AdminRecentFile[] {
  const pinnedSet = new Set(pinnedRelativePaths);

  return [...entries]
    .sort((left, right) => right.mtime.getTime() - left.mtime.getTime())
    .slice(0, limit)
    .map((entry) => ({
      absolutePath: entry.absolutePath,
      relativePath: entry.relativePath,
      parentDirectory: dirname(entry.relativePath).replace(/\\/g, "/"),
      updatedAtLabel: format(entry.mtime, "yyyy-MM-dd HH:mm"),
      isPinned: pinnedSet.has(entry.relativePath)
    }));
}

export function buildPinnedAdminFiles(
  entries: readonly MemoIndexedEntry[],
  pinnedRelativePaths: readonly string[]
): readonly AdminMemoFile[] {
  const entryMap = new Map(entries.map((entry) => [entry.relativePath, entry]));

  return pinnedRelativePaths.flatMap((relativePath) => {
    const entry = entryMap.get(relativePath);
    if (!entry) {
      return [];
    }

    return [
      {
        absolutePath: entry.absolutePath,
        relativePath: entry.relativePath,
        parentDirectory: dirname(entry.relativePath).replace(/\\/g, "/"),
        updatedAtLabel: format(entry.mtime, "yyyy-MM-dd HH:mm"),
        isPinned: true
      }
    ];
  });
}

export function buildAdminTemplateAssets(
  assets: readonly {
    absolutePath: string;
    name: string;
    size: number;
    updatedAt: Date;
  }[],
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "memotemplate">
): readonly AdminTemplateAsset[] {
  const preferredTemplatePath = getPreferredTemplatePath(settings);

  return assets.map((asset) => ({
    absolutePath: asset.absolutePath,
    name: asset.name,
    sizeLabel: formatFileSize(asset.size),
    updatedAtLabel: format(asset.updatedAt, "yyyy-MM-dd HH:mm"),
    isDefault: areSameMemoPaths(asset.absolutePath, preferredTemplatePath)
  }));
}

export function buildAdminSnippetAssets(
  assets: readonly {
    absolutePath: string;
    name: string;
    size: number;
    updatedAt: Date;
    snippets: readonly { prefixes: readonly string[]; name: string }[];
    loadError?: string;
  }[]
): readonly AdminSnippetAsset[] {
  return assets.map((asset) => ({
    absolutePath: asset.absolutePath,
    name: asset.name,
    sizeLabel: formatFileSize(asset.size),
    updatedAtLabel: format(asset.updatedAt, "yyyy-MM-dd HH:mm"),
    snippetCount: asset.snippets.length,
    snippetSummaries: asset.snippets.slice(0, 4).flatMap((snippet) => snippet.prefixes.map((prefix) => `${prefix} - ${snippet.name}`)),
    loadError: asset.loadError
  }));
}

export function buildAdminFolderCounts(
  entries: readonly Pick<MemoIndexedEntry, "relativePath">[],
  limit = 6
): readonly AdminCountRow[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const folder = dirname(entry.relativePath).replace(/\\/g, "/");
    const label = folder === "." ? "(root)" : folder;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

async function isExistingDirectory(directoryPath: string): Promise<boolean> {
  const normalizedPath = directoryPath.trim();
  if (normalizedPath === "") {
    return false;
  }

  try {
    const info = await stat(normalizedPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function readOptionalFileInfo(filePath: string): Promise<{ exists: boolean; size: number } | undefined> {
  try {
    const info = await stat(filePath);
    return { exists: info.isFile(), size: info.size };
  } catch {
    return undefined;
  }
}

function getLatestUpdatedAtLabel(entries: readonly MemoIndexedEntry[]): string {
  const latestEntry = [...entries].sort((left, right) => right.mtime.getTime() - left.mtime.getTime())[0];
  return latestEntry ? format(latestEntry.mtime, "yyyy-MM-dd HH:mm") : "n/a";
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
