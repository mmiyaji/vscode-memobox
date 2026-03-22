import { format } from "date-fns";
import { memoFileDateFormat } from "./constants";
import { buildMemoTitleInput } from "./fileName";

export function buildQuickMemoInitialContent(date: Date, dateFormat: string): string {
  return `# ${format(date, dateFormat || memoFileDateFormat)}\n\n`;
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
