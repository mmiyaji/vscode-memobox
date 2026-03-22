import { format } from "date-fns";
import { maxMemoTitleLength, memoFileDateFormat } from "./constants";

export function buildMemoFileName(date: Date, title: string, dateSuffixFormat = ""): string {
  const dateLabel = format(date, memoFileDateFormat);
  const dateSuffix = dateSuffixFormat.trim() === "" ? "" : format(date, dateSuffixFormat.trim());
  const sanitizedTitle = sanitizeMemoTitle(title);

  if (sanitizedTitle === "") {
    return `${dateLabel}${dateSuffix}.md`;
  }

  return `${dateLabel}${dateSuffix}-${sanitizedTitle}.md`;
}

export function sanitizeMemoTitle(value: string): string {
  return value
    .trim()
    .slice(0, maxMemoTitleLength)
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildMemoTitleInput(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxMemoTitleLength);
}
