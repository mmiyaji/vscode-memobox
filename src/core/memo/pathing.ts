import { mkdir } from "node:fs/promises";
import { join, normalize } from "node:path";
import { format } from "date-fns";
import type { MemoBoxSettings } from "../config/types";
import { buildMemoFileName } from "./fileName";

export function getMemoDateDirectory(settings: MemoBoxSettings, date: Date): string {
  if (settings.datePathFormat.trim() === "") {
    return normalize(settings.memodir);
  }

  return normalize(join(settings.memodir, format(date, settings.datePathFormat)));
}

export async function ensureMemoDateDirectory(settings: MemoBoxSettings, date: Date): Promise<string> {
  const directory = getMemoDateDirectory(settings, date);
  await mkdir(directory, { recursive: true });
  return directory;
}

export function getMemoFilePath(settings: MemoBoxSettings, date: Date, title: string): string {
  return normalize(
    join(
      getMemoDateDirectory(settings, date),
      buildMemoFileName(date, title, settings.memoNewFilenameDateSuffix)
    )
  );
}

export function getQuickMemoFilePath(settings: MemoBoxSettings, date: Date): string {
  return normalize(join(getMemoDateDirectory(settings, date), buildMemoFileName(date, "")));
}

export function getDefaultTemplatePath(settings: Pick<MemoBoxSettings, "memodir" | "metaDir">): string {
  return normalize(join(settings.memodir, settings.metaDir, "templates", "simple.md"));
}

export function getPreferredTemplatePath(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "memotemplate">
): string {
  return settings.memotemplate.trim() !== "" ? normalize(settings.memotemplate) : getDefaultTemplatePath(settings);
}

export function areSameMemoPaths(leftPath: string, rightPath: string): boolean {
  const leftNormalized = normalize(leftPath);
  const rightNormalized = normalize(rightPath);

  if (process.platform === "win32") {
    return leftNormalized.toLowerCase() === rightNormalized.toLowerCase();
  }

  return leftNormalized === rightNormalized;
}
