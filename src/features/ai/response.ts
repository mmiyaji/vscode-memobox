export function parseJsonStringArray(rawText: string): readonly string[] {
  const normalizedText = unwrapAiTextResponse(rawText);
  const match = normalizedText.match(/\[[\s\S]*?\]/u);
  if (!match) {
    return [];
  }

  try {
    const value = JSON.parse(match[0]) as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  } catch {
    return [];
  }
}

export function unwrapAiTextResponse(rawText: string): string {
  const trimmed = rawText.trim();
  const fencedBlockMatch = trimmed.match(/^```(?:[\w-]+)?\r?\n([\s\S]*?)\r?\n```$/u);
  if (fencedBlockMatch?.[1]) {
    return fencedBlockMatch[1].trim();
  }

  return trimmed;
}
