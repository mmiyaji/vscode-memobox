import { readFile, stat } from "node:fs/promises";
import { basename, dirname, normalize } from "node:path";
import { format } from "date-fns";
import { defaultAiCostMode, defaultAiMonthlyLimitUsd, defaultAiPerRequestLimitUsd } from "../../core/config/constants";
import type { MemoBoxSettings } from "../../core/config/types";
import {
  getIndexFilePath,
  getMemoIndexEntries,
  getMemoIndexStorageState,
  type MemoIndexLoadSource,
  type MemoIndexedEntry
} from "../../core/index/memoIndex";
import { resolveMemoBoxAiConfigurationWithSecrets, type MemoBoxAiApiKeySource } from "../../infra/ai/configuration";
import {
  getPagesDirectory,
  getSnippetsDirectory,
  getTemplatesDirectory,
  listPageHtmlFiles,
  listSnippetAssets,
  listTemplateAssets
} from "../../core/meta/memoAssets";
import { readAiUsageMonthSummary } from "../../infra/ai/usageLedger";
import { readPinnedMemoRelativePaths } from "../../core/meta/pinnedMemos";
import { assessMemoRootScope, type MemoRootRiskCode } from "../../core/memo/memoRootGuard";
import { areSameMemoPaths, getMemoDateDirectory, getPreferredTemplatePath, getQuickMemoFilePath } from "../../core/memo/pathing";
import { buildMemoTagSummaries, type MemoTagSummary } from "../../core/memo/tags";
import { getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../../core/meta/memoWorkspace";
import { getRecommendedMemoRoot } from "../welcome/recommendedMemoRoot";
import { logMemoBoxInfo } from "../../shared/logging";
import { normalizeFilePathForComparison } from "../../shared/filePathComparison";

export interface CustomPage {
  readonly id: string;
  readonly title: string;
  readonly htmlBody: string;
  readonly absolutePath: string;
}

interface CustomPagesCacheEntry {
  readonly key: string;
  readonly pages: readonly CustomPage[];
  readonly expiresAt: number;
}

const customPagesCacheTtlMs = 2000;
const adminTopTagLimit = 8;
let customPagesCache: CustomPagesCacheEntry | undefined;

export interface AdminDashboardModel {
  readonly version: string;
  readonly generatedAtLabel: string;
  readonly memoRoot: string;
  readonly memoRootReady: boolean;
  readonly memoRootLooksBroad: boolean;
  readonly memoRootRiskCodes: readonly MemoRootRiskCode[];
  readonly recommendedMemoRoot: string;
  readonly workspaceFilePath: string;
  readonly workspaceFileExists: boolean;
  readonly datePathFormat: string;
  readonly metaDir: string;
  readonly locale: string;
  readonly adminOpenOnStartup: boolean;
  readonly excludeDirectories: readonly string[];
  readonly maxScanDepth: number;
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
  readonly aiEnabled: boolean;
  readonly aiCostMode: string;
  readonly aiPerRequestLimitUsd: number;
  readonly aiMonthlyLimitUsd: number;
  readonly aiConfigured: boolean;
  readonly aiProfileName: string;
  readonly aiProvider: string;
  readonly aiModel: string;
  readonly aiEndpoint: string;
  readonly aiApiKeySource: MemoBoxAiApiKeySource;
  readonly aiIssueSummary: string;
  readonly aiMonthlyEstimatedCostUsd: number;
  readonly aiMonthlyRequestCount: number;
  readonly totalFiles: number;
  readonly latestUpdatedAtLabel: string;
  readonly indexFilePath: string;
  readonly indexFileExists: boolean;
  readonly indexFileSizeLabel: string;
  readonly indexLoadSource: MemoIndexLoadSource;
  readonly indexBackupExists: boolean;
  readonly indexTransientBackupExists: boolean;
  readonly pinnedFiles: readonly AdminMemoFile[];
  readonly recentFiles: readonly AdminRecentFile[];
  readonly folderCounts: readonly AdminCountRow[];
  readonly topTags: readonly MemoTagSummary[];
  readonly totalTagCount: number;
  readonly hiddenTagCount: number;
  readonly customPages: readonly CustomPage[];
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
  now: Date = new Date(),
  workspacePageDirectories: readonly string[] = []
): Promise<AdminDashboardModel> {
  const memoRootReady = await isExistingDirectory(settings.memodir);
  const entries = memoRootReady ? await getMemoIndexEntries(settings) : [];
  const pinnedRelativePaths = memoRootReady ? await readPinnedMemoRelativePaths(settings) : [];
  const indexFilePath = settings.memodir.trim() === "" ? "" : getIndexFilePath(settings);
  const indexFileInfo = indexFilePath === "" ? undefined : await readOptionalFileInfo(indexFilePath);
  const indexStorage = memoRootReady
    ? await getMemoIndexStorageState(settings)
    : {
        primaryPath: "",
        backupPath: "",
        transientBackupPath: "",
        primaryExists: false,
        backupExists: false,
        transientBackupExists: false,
        loadSource: "none" as const
      };
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
  const ai = await resolveMemoBoxAiConfigurationWithSecrets(settings);
  const aiUsage = memoRootReady
    ? await readAiUsageMonthSummary(settings, now)
    : {
        periodKey: "",
        estimatedCostUsd: 0,
        requests: 0,
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      };
  const memoRootAssessment = assessMemoRootScope(settings.memodir);
  const recommendedMemoRoot = getRecommendedMemoRoot();
  const customPages = await buildCustomPages(settings, workspacePageDirectories);
  const allTags = buildMemoTagSummaries(entries);

  return {
    version,
    generatedAtLabel: format(now, "yyyy-MM-dd HH:mm"),
    memoRoot: settings.memodir.trim(),
    memoRootReady,
    memoRootLooksBroad: memoRootAssessment.isSuspicious,
    memoRootRiskCodes: memoRootAssessment.riskCodes,
    recommendedMemoRoot,
    workspaceFilePath,
    workspaceFileExists: workspaceFileInfo?.exists ?? false,
    datePathFormat: settings.datePathFormat,
    metaDir: settings.metaDir,
    locale: settings.locale,
    adminOpenOnStartup: settings.adminOpenOnStartup,
    excludeDirectories: settings.excludeDirectories,
    maxScanDepth: settings.maxScanDepth,
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
    aiEnabled: ai.enabled,
    aiCostMode: settings.aiCostMode ?? defaultAiCostMode,
    aiPerRequestLimitUsd: settings.aiPerRequestLimitUsd ?? defaultAiPerRequestLimitUsd,
    aiMonthlyLimitUsd: settings.aiMonthlyLimitUsd ?? defaultAiMonthlyLimitUsd,
    aiConfigured: ai.configured,
    aiProfileName: ai.profileName,
    aiProvider: ai.profile?.provider ?? "",
    aiModel: ai.profile?.model ?? "",
    aiEndpoint: ai.profile?.endpoint ?? "",
    aiApiKeySource: ai.profile?.apiKeySource ?? "none",
    aiIssueSummary: ai.issues.join(" "),
    aiMonthlyEstimatedCostUsd: aiUsage.estimatedCostUsd,
    aiMonthlyRequestCount: aiUsage.requests,
    totalFiles: entries.length,
    latestUpdatedAtLabel: getLatestUpdatedAtLabel(entries),
    indexFilePath,
    indexFileExists: indexFileInfo?.exists ?? false,
    indexFileSizeLabel: indexFileInfo ? formatFileSize(indexFileInfo.size) : "not created",
    indexLoadSource: indexStorage.loadSource,
    indexBackupExists: indexStorage.backupExists,
    indexTransientBackupExists: indexStorage.transientBackupExists,
    pinnedFiles: buildPinnedAdminFiles(entries, pinnedRelativePaths),
    recentFiles: buildAdminRecentFiles(entries, pinnedRelativePaths, settings.recentCount),
    folderCounts: buildAdminFolderCounts(entries),
    topTags: allTags.slice(0, adminTopTagLimit),
    totalTagCount: allTags.length,
    hiddenTagCount: Math.max(0, allTags.length - adminTopTagLimit),
    customPages
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

export async function isExistingDirectory(directoryPath: string): Promise<boolean> {
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

export function getLatestUpdatedAtLabel(entries: readonly MemoIndexedEntry[]): string {
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

function collectPageDirectoryCandidates(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  workspacePageDirectories: readonly string[]
): readonly string[] {
  const dirs: string[] = [];
  const memodir = settings.memodir.trim();
  if (memodir !== "") {
    dirs.push(getPagesDirectory(settings));
  }
  for (const dir of workspacePageDirectories) {
    const trimmed = dir.trim();
    if (trimmed !== "") {
      dirs.push(normalize(trimmed));
    }
  }
  const unique = new Map<string, string>();
  for (const dir of dirs) {
    unique.set(normalizeFilePathForComparison(dir), dir);
  }

  return [...unique.values()];
}

export async function buildCustomPages(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  workspacePageDirectories: readonly string[]
): Promise<readonly CustomPage[]> {
  const candidateDirectories = collectPageDirectoryCandidates(settings, workspacePageDirectories);
  const cacheKey = JSON.stringify({
    memodir: normalizeFilePathForComparison(settings.memodir),
    metaDir: settings.metaDir,
    directories: candidateDirectories.map((dir) => normalizeFilePathForComparison(dir))
  });
  const now = Date.now();
  if (customPagesCache && customPagesCache.key === cacheKey && customPagesCache.expiresAt > now) {
    return customPagesCache.pages;
  }

  const seenPaths = new Set<string>();
  const assets: { readonly absolutePath: string; readonly name: string }[] = [];
  const scanned: Array<{ readonly directory: string; readonly exists: boolean; readonly htmlCount: number }> = [];

  for (const dir of candidateDirectories) {
    let exists = false;
    try {
      exists = (await stat(dir)).isDirectory();
    } catch {
      exists = false;
    }

    const found = exists ? await listPageHtmlFiles(dir) : [];
    scanned.push({ directory: dir, exists, htmlCount: found.length });
    for (const page of found) {
      const key = normalizeFilePathForComparison(page.absolutePath);
      if (!seenPaths.has(key)) {
        seenPaths.add(key);
        assets.push(page);
      }
    }
  }

  assets.sort((left, right) => left.name.localeCompare(right.name));

  const usedTabIds = new Set<string>();
  const pages: CustomPage[] = [];

  for (const asset of assets) {
    try {
      const raw = await readFile(asset.absolutePath, "utf8");
      const { title, body } = parseCustomPageContent(raw, asset.name);
      let id = basename(asset.name, ".html").replace(/[^a-zA-Z0-9_-]/g, "_");
      if (id === "") {
        id = "page";
      }
      let uniqueId = id;
      let suffix = 0;
      while (usedTabIds.has(uniqueId)) {
        suffix += 1;
        uniqueId = `${id}_${suffix}`;
      }
      usedTabIds.add(uniqueId);

      pages.push({ id: uniqueId, title, htmlBody: body, absolutePath: asset.absolutePath });
    } catch {
      continue;
    }
  }

  logMemoBoxInfo("pages.scan", "Custom pages scan completed.", {
    memodir: settings.memodir,
    metaDir: settings.metaDir,
    workspacePageDirectories,
    candidatesScanned: scanned,
    foundHtmlAssets: assets.length,
    builtPages: pages.length
  });

  customPagesCache = {
    key: cacheKey,
    pages,
    expiresAt: now + customPagesCacheTtlMs
  };

  return pages;
}

export function parseCustomPageContent(
  raw: string,
  fileName: string
): { title: string; body: string } {
  const titleMatch = raw.match(/^<!--\s*title:\s*(.+?)\s*-->/);
  const title = titleMatch ? titleMatch[1]! : basename(fileName, ".html");
  const body = titleMatch ? raw.slice(titleMatch[0].length).trimStart() : raw;

  return { title, body };
}
