import { isAbsolute, normalize, relative } from "node:path";

export function areSameFilePath(left: string, right: string): boolean {
  return normalizeFilePathForComparison(left) === normalizeFilePathForComparison(right);
}

export function normalizeFilePathForComparison(value: string): string {
  const normalized = normalize(value).replace(/\//gu, "\\");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function isFilePathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const normalizedRoot = normalize(rootPath);
  const normalizedCandidate = normalize(candidatePath);
  const relativePath = relative(normalizedRoot, normalizedCandidate);
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}
