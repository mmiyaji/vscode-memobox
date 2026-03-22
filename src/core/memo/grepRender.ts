import type { MemoTextMatch } from "./textMatch";

export function buildGrepResultsText(
  query: string,
  scopeLabel: string,
  matches: readonly MemoTextMatch[]
): string {
  const lines = [
    "# MemoBox Grep",
    "",
    `- Query: ${query}`,
    `- Scope: ${scopeLabel}`,
    `- Results: ${matches.length}`,
    ""
  ];

  for (const match of matches) {
    lines.push(`- ${match.relativePath}:${match.lineNumber}:${match.columnNumber}`);
    lines.push(`  ${match.lineText}`);
  }

  lines.push("");
  return lines.join("\n");
}
