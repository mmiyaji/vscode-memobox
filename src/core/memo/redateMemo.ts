import { basename, dirname, extname, join, normalize, relative } from "node:path";
import { format } from "date-fns";
import { memoFileDateFormat } from "./constants";

const memoDatePrefixPattern = /^\d{4}-\d{2}-\d{2}(?=-|$)/u;

export function isPathInsideMemoRoot(memoRoot: string, filePath: string): boolean {
  const normalizedRoot = normalize(memoRoot);
  const normalizedFilePath = normalize(filePath);
  const relativePath = relative(normalizedRoot, normalizedFilePath);

  return relativePath !== "" && !relativePath.startsWith("..") && relativePath !== normalizedFilePath;
}

export function buildRedatedMemoPath(filePath: string, nextDate: Date): string | undefined {
  const parsedName = parseRedatableMemoName(basename(filePath));
  if (!parsedName) {
    return undefined;
  }

  const nextDateLabel = format(nextDate, memoFileDateFormat);
  return join(dirname(filePath), `${nextDateLabel}${parsedName.suffix}`);
}

interface ParsedRedatableMemoName {
  readonly suffix: string;
}

function parseRedatableMemoName(fileName: string): ParsedRedatableMemoName | undefined {
  const extension = extname(fileName);
  const stem = extension === "" ? fileName : fileName.slice(0, -extension.length);
  const dateMatch = stem.match(memoDatePrefixPattern);

  if (!dateMatch) {
    return undefined;
  }

  const suffix = stem.slice(dateMatch[0].length);
  if (suffix === "") {
    return undefined;
  }

  return { suffix: `${suffix}${extension}` };
}
