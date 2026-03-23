import { startOfDay, startOfWeek, subDays } from "date-fns";
import { unwrapAiTextResponse } from "./response";

export interface LinkSuggestion {
  readonly keyword: string;
  readonly memo_index: number;
  readonly reason?: string;
}

export type ReportRangeValue = "today" | "3days" | "week" | "7days";

export function resolveReportStartDate(range: ReportRangeValue, now: Date): Date {
  switch (range) {
    case "today":
      return startOfDay(now);
    case "3days":
      return subDays(startOfDay(now), 2);
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "7days":
      return subDays(startOfDay(now), 6);
    default:
      return startOfDay(now);
  }
}

export function parseLinkSuggestions(rawText: string): readonly LinkSuggestion[] {
  const normalizedText = unwrapAiTextResponse(rawText);
  const match = normalizedText.match(/\[[\s\S]*\]/u);
  const matchedJson = match?.[0];
  if (!matchedJson) {
    return [];
  }

  try {
    const value = JSON.parse(matchedJson) as unknown;
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as LinkSuggestion).keyword !== "string" ||
        typeof (item as LinkSuggestion).memo_index !== "number"
      ) {
        return [];
      }

      const validItem = item as LinkSuggestion;
      return [
        {
          keyword: validItem.keyword.trim(),
          memo_index: Math.floor(validItem.memo_index),
          reason: typeof validItem.reason === "string" ? validItem.reason.trim() : undefined
        }
      ];
    });
  } catch {
    return [];
  }
}
