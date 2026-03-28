import { dirname, join, normalize } from "node:path";
import { defaultMetaDir } from "../../core/config/constants";
import type { MemoBoxSettings } from "../../core/config/types";
import { isFilePathInsideRoot, normalizeFilePathForComparison } from "../../shared/filePathComparison";

const customPageAllowedCommands = new Set([
  "memobox.newMemo",
  "memobox.quickMemo",
  "memobox.listMemos",
  "memobox.listTags",
  "memobox.grepMemos",
  "memobox.todoMemos",
  "memobox.relatedMemos",
  "memobox.openMemoFolder",
  "memobox.openMarkdownInBrowser",
  "memobox.openSettings",
  "memobox.openAdmin",
  "memobox.openSetup",
  "memobox.openCommandLauncher",
  "memobox.refreshIndex",
  "memobox.rebuildIndex",
  "memobox.clearIndexCache",
  "memobox.openCustomPage"
]);

export function isAllowedCustomPageCommand(command: string): boolean {
  return customPageAllowedCommands.has(command);
}

export function buildCustomPageAllowedRoots(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  currentPagePath: string,
  workspacePageDirectories: readonly string[]
): readonly string[] {
  const roots: string[] = [];
  const memodir = settings.memodir.trim();
  if (memodir !== "") {
    roots.push(normalize(memodir));
  }
  roots.push(normalize(dirname(currentPagePath)));
  for (const pageDir of workspacePageDirectories) {
    const trimmed = pageDir.trim();
    if (trimmed !== "") {
      roots.push(normalize(trimmed));
    }
  }

  const unique = new Map<string, string>();
  for (const root of roots) {
    unique.set(normalizeFilePathForComparison(root), root);
  }

  return [...unique.values()];
}

export function isAllowedCustomPageTargetPath(path: string, allowedRoots: readonly string[]): boolean {
  for (const root of allowedRoots) {
    if (areSamePath(path, root) || isFilePathInsideRoot(root, path)) {
      return true;
    }
  }
  return false;
}

export function isAllowedCustomPagePath(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  path: string,
  workspacePageDirectories: readonly string[]
): boolean {
  const candidatePath = normalize(path);
  if (!candidatePath.toLowerCase().endsWith(".html")) {
    return false;
  }
  const memodir = settings.memodir.trim();
  const roots: string[] = [];
  if (memodir !== "") {
    roots.push(normalize(join(memodir, settings.metaDir.trim() || defaultMetaDir, "pages")));
  }
  roots.push(...workspacePageDirectories);

  return isAllowedCustomPageTargetPath(candidatePath, roots);
}

function areSamePath(left: string, right: string): boolean {
  return normalizeFilePathForComparison(left) === normalizeFilePathForComparison(right);
}
