import { normalize } from "node:path";
import type { MemoBoxSettings } from "../../core/config/types";
import { getSnippetsDirectory, getTemplatesDirectory } from "../../core/meta/memoAssets";
import { areSameFilePath, isFilePathInsideRoot, normalizeFilePathForComparison } from "../../shared/filePathComparison";

type AdminPathSettings = Pick<MemoBoxSettings, "memodir" | "metaDir" | "templatesDir" | "snippetsDir">;

export function buildAdminAllowedRoots(settings: AdminPathSettings): readonly string[] {
  const roots: string[] = [];
  const memoRoot = settings.memodir.trim();

  if (memoRoot !== "") {
    roots.push(normalize(memoRoot));
  }

  if (memoRoot !== "" || settings.templatesDir.trim() !== "") {
    roots.push(getTemplatesDirectory(settings));
  }

  if (memoRoot !== "" || settings.snippetsDir.trim() !== "") {
    roots.push(getSnippetsDirectory(settings));
  }

  const unique = new Map<string, string>();
  for (const root of roots) {
    unique.set(normalizeFilePathForComparison(root), root);
  }

  return [...unique.values()];
}

export function isAllowedAdminTargetPath(path: string, allowedRoots: readonly string[]): boolean {
  const candidatePath = path.trim();
  if (candidatePath === "") {
    return false;
  }

  for (const root of allowedRoots) {
    if (areSameFilePath(candidatePath, root) || isFilePathInsideRoot(root, candidatePath)) {
      return true;
    }
  }

  return false;
}
