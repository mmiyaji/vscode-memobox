import { readFile } from "node:fs/promises";
import { format } from "date-fns";
import type { MemoBoxSettings } from "../config/types";
import { builtinTemplate, memoFileDateFormat } from "./constants";
import { getPreferredTemplatePath } from "./pathing";

export async function buildNewMemoContent(
  settings: MemoBoxSettings,
  title: string,
  date: Date,
  templatePath?: string
): Promise<string> {
  const template = await readMemoTemplate(templatePath ?? getPreferredTemplatePath(settings));

  return renderMemoTemplate(template, {
    date: format(date, memoFileDateFormat),
    title: title.trim()
  });
}

export function renderMemoTemplate(
  template: string,
  values: { date: string; title: string }
): string {
  return template
    .replaceAll("{{.Date}}", values.date)
    .replaceAll("{{date}}", values.date)
    .replaceAll("{{.Title}}", values.title)
    .replaceAll("{{title}}", values.title);
}

async function readMemoTemplate(templatePath: string): Promise<string> {
  try {
    return await readFile(templatePath, "utf8");
  } catch {
    return builtinTemplate;
  }
}
