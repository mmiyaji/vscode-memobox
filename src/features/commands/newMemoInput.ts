import { format } from "date-fns";
import type { MemoBoxSettings } from "../../core/config/types";

export function buildNewMemoInputPlaceholder(settings: Pick<MemoBoxSettings, "memoNewFilenameDateSuffix">, date: Date): string {
  return `Enter a memo title (default: ${format(date, "yyyy-MM-dd")}${settings.memoNewFilenameDateSuffix}.md).`;
}
