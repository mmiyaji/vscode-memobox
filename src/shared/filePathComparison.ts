import { normalize } from "node:path";

export function areSameFilePath(left: string, right: string): boolean {
  return normalizeFilePathForComparison(left) === normalizeFilePathForComparison(right);
}

export function normalizeFilePathForComparison(value: string): string {
  const normalized = normalize(value).replace(/\//gu, "\\");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
