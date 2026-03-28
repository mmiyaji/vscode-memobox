import { format } from "date-fns";
import type { MemoBoxSettings } from "../config/types";
import { memoFileDateFormat } from "./constants";
import { buildMemoTitleInput } from "./fileName";
import { buildNewMemoContent } from "./template";

export async function buildQuickMemoInitialContent(settings: MemoBoxSettings, date: Date): Promise<string> {
  const dailyTitle = format(date, memoFileDateFormat);
  return await buildNewMemoContent(settings, dailyTitle, date);
}

export function buildQuickMemoAppendText(
  options: {
    currentContent: string;
    date: Date;
    selectedText: string;
    titlePrefix: string;
    dateFormat: string;
  }
): string {
  const normalizedSelection = buildMemoTitleInput(options.selectedText);
  const heading = `${options.titlePrefix}${format(options.date, options.dateFormat)}${normalizedSelection ? ` ${normalizedSelection}` : ""}`;
  const prefix = options.currentContent.trim().length === 0
    ? ""
    : options.currentContent.endsWith("\n")
      ? "\n"
      : "\n\n";

  return `${prefix}${heading}\n\n`;
}
