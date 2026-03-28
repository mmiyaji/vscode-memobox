import { format } from "date-fns";
import type { MemoBoxSettings } from "../../core/config/types";
import type { TemplateKeyUsage } from "../../shared/webviewTemplate";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { getIndexFilePath } from "../../core/index/memoIndex";
import { readPinnedMemoRelativePaths } from "../../core/meta/pinnedMemos";
import { listTemplateAssets } from "../../core/meta/memoAssets";
import { listSnippetAssets } from "../../core/meta/memoAssets";
import { getMemoDateDirectory, getQuickMemoFilePath, getPreferredTemplatePath } from "../../core/memo/pathing";
import { buildMemoTagSummaries } from "../../core/memo/tags";
import {
  isExistingDirectory,
  getLatestUpdatedAtLabel,
  buildAdminRecentFiles,
  buildPinnedAdminFiles,
  buildAdminFolderCounts,
  buildAdminTemplateAssets,
  buildAdminSnippetAssets
} from "../admin/adminViewModel";
import type { CustomPageModelSlice } from "../admin/adminHtml";

type DataGroup = "index" | "pinned" | "templates" | "snippets";

const variableToGroup: Partial<Record<string, DataGroup>> = {
  TOTAL_FILES: "index",
  LATEST_UPDATED_AT: "index"
};

const loopToGroup: Partial<Record<string, DataGroup>> = {
  RECENT_FILES: "index",
  PINNED_FILES: "pinned",
  FOLDER_COUNTS: "index",
  TOP_TAGS: "index",
  TEMPLATES: "templates",
  SNIPPETS: "snippets"
};

export function resolveRequiredGroups(usage: TemplateKeyUsage): ReadonlySet<DataGroup> {
  const groups = new Set<DataGroup>();

  for (const key of usage.variables) {
    const group = variableToGroup[key];
    if (group) {
      groups.add(group);
    }
  }

  for (const key of usage.loops) {
    const group = loopToGroup[key];
    if (group) {
      groups.add(group);
    }
  }

  if (usage.loops.has("RECENT_FILES")) {
    groups.add("pinned");
  }
  if (groups.has("pinned")) {
    groups.add("index");
  }

  return groups;
}

export async function buildCustomPageDataModel(
  settings: MemoBoxSettings,
  version: string,
  now: Date,
  requiredGroups: ReadonlySet<string>
): Promise<CustomPageModelSlice> {
  const memoRootReady = await isExistingDirectory(settings.memodir);

  const entries = requiredGroups.has("index") && memoRootReady
    ? await getMemoIndexEntries(settings)
    : [];

  const pinnedRelativePaths = requiredGroups.has("pinned") && memoRootReady
    ? await readPinnedMemoRelativePaths(settings)
    : [];

  const templateAssets = requiredGroups.has("templates") && memoRootReady
    ? await listTemplateAssets(settings)
    : [];

  const snippetAssets = requiredGroups.has("snippets") && memoRootReady
    ? await listSnippetAssets(settings)
    : [];

  return {
    version,
    generatedAtLabel: format(now, "yyyy-MM-dd HH:mm"),
    memoRoot: settings.memodir.trim(),
    todayDirectory: memoRootReady ? getMemoDateDirectory(settings, now) : "",
    todayMemoPath: memoRootReady ? getQuickMemoFilePath(settings, now) : "",
    templatePath: memoRootReady ? getPreferredTemplatePath(settings) : "",
    locale: settings.locale,
    datePathFormat: settings.datePathFormat,
    metaDir: settings.metaDir,
    indexFilePath: settings.memodir.trim() === "" ? "" : getIndexFilePath(settings),
    totalFiles: entries.length,
    latestUpdatedAtLabel: getLatestUpdatedAtLabel(entries),
    recentFiles: buildAdminRecentFiles(entries, pinnedRelativePaths, settings.recentCount),
    pinnedFiles: buildPinnedAdminFiles(entries, pinnedRelativePaths),
    folderCounts: buildAdminFolderCounts(entries),
    topTags: buildMemoTagSummaries(entries, 10),
    templates: buildAdminTemplateAssets(templateAssets, settings),
    snippets: buildAdminSnippetAssets(snippetAssets)
  };
}
