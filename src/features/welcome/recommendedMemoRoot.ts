import { homedir } from "node:os";
import { join, normalize } from "node:path";

export function getRecommendedMemoRoot(homePath = homedir()): string {
  return normalize(join(homePath, "Documents", "MemoBox"));
}
