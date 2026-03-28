export function formatMarkdownTable(input: string): string | undefined {
  const lines = input
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length < 2 || !lines.every((line) => line.includes("|"))) {
    return undefined;
  }

  const rows = lines.map(parseTableLine);
  const widthByColumn: number[] = [];
  rows.forEach((row) => {
    row.forEach((cell, index) => {
      widthByColumn[index] = Math.max(widthByColumn[index] ?? 0, getDisplayWidth(cell));
    });
  });

  return rows
    .map((row, rowIndex) => {
      if (rowIndex === 1 && isAlignmentRow(row)) {
        return `| ${row.map((cell, index) => alignMarkdownRule(cell, widthByColumn[index] ?? 3)).join(" | ")} |`;
      }

      return `| ${row.map((cell, index) => `${cell}${" ".repeat(Math.max((widthByColumn[index] ?? 0) - getDisplayWidth(cell), 0))}`).join(" | ")} |`;
    })
    .join("\n");
}

function parseTableLine(line: string): string[] {
  const trimmed = line.replace(/^\|/u, "").replace(/\|$/u, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isAlignmentRow(row: readonly string[]): boolean {
  return row.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function alignMarkdownRule(cell: string, width: number): string {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  const coreWidth = Math.max(width, 3) - (left ? 1 : 0) - (right ? 1 : 0);
  return `${left ? ":" : ""}${"-".repeat(Math.max(coreWidth, 3))}${right ? ":" : ""}`;
}

function getDisplayWidth(value: string): number {
  return Array.from(value).reduce((width, character) => width + getCharacterDisplayWidth(character), 0);
}

function getCharacterDisplayWidth(character: string): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) {
    return 0;
  }

  if (
    codePoint >= 0x1100 && (
      codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd)
    )
  ) {
    return 2;
  }

  return 1;
}
