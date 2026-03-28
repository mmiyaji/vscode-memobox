export interface AlignDelimitedColumnsResult {
  readonly delimiter: string;
  readonly lineCount: number;
  readonly alignedText: string;
}

export interface AlignDelimitedColumnsOptions {
  readonly eastAsianCharacterWidth?: 1 | 2;
}

interface ParsedRow {
  readonly cells: readonly string[];
}

const supportedDelimiters = [",", "\t", ";"] as const;

export function alignDelimitedColumns(
  input: string,
  options?: AlignDelimitedColumnsOptions
): AlignDelimitedColumnsResult | undefined {
  if (input.length === 0) {
    return undefined;
  }

  const lines = input.split(/\r?\n/);
  if (lines.length === 0) {
    return undefined;
  }

  const contentLines = lines.filter((line) => line.trim().length > 0);
  if (contentLines.length === 0) {
    return undefined;
  }

  const delimiter = detectDelimiter(contentLines);
  if (delimiter === undefined) {
    return undefined;
  }

  const cjkWidth = options?.eastAsianCharacterWidth ?? 2;
  const parsedRows = lines.map((line) => parseDelimitedRow(line, delimiter));
  const widthByColumn = collectColumnWidths(parsedRows, cjkWidth);
  const alignedText = parsedRows
    .map((row) => formatAlignedRow(row, delimiter, widthByColumn, cjkWidth))
    .join("\n");

  return {
    delimiter,
    lineCount: lines.length,
    alignedText
  };
}

function detectDelimiter(lines: readonly string[]): string | undefined {
  const scoreByDelimiter = new Map<string, number>();

  for (const delimiter of supportedDelimiters) {
    let score = 0;
    for (const line of lines) {
      score += countDelimiterOccurrences(line, delimiter);
    }
    scoreByDelimiter.set(delimiter, score);
  }

  let bestDelimiter: string | undefined;
  let bestScore = 0;
  for (const [delimiter, score] of scoreByDelimiter) {
    if (score > bestScore) {
      bestDelimiter = delimiter;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestDelimiter : undefined;
}

function countDelimiterOccurrences(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === delimiter) {
      count += 1;
    }
  }

  return count;
}

function parseDelimitedRow(line: string, delimiter: string): ParsedRow {
  if (line.trim().length === 0) {
    return { cells: [] };
  }

  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      current += character;
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === delimiter) {
      cells.push(normalizeCell(current));
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(normalizeCell(current));
  return { cells };
}

function normalizeCell(rawCell: string): string {
  return rawCell.trim();
}

function collectColumnWidths(rows: readonly ParsedRow[], cjkWidth: number): number[] {
  const widthsByColumn: number[][] = [];

  for (const row of rows) {
    row.cells.forEach((cell, index) => {
      const width = getDisplayWidth(cell, cjkWidth);
      const columnWidths = widthsByColumn[index] ?? [];
      columnWidths.push(width);
      widthsByColumn[index] = columnWidths;
    });
  }

  return widthsByColumn.map((columnWidths) =>
    columnWidths.length === 0 ? 0 : Math.max(...columnWidths)
  );
}

function formatAlignedRow(row: ParsedRow, delimiter: string, widthByColumn: readonly number[], cjkWidth: number): string {
  if (row.cells.length === 0) {
    return "";
  }

  return row.cells
    .map((cell, index) => {
      if (index === row.cells.length - 1) {
        return cell;
      }

      const padding = Math.max((widthByColumn[index] ?? 0) - getDisplayWidth(cell, cjkWidth), 0);
      return `${cell}${delimiter}${" ".repeat(padding + 1)}`;
    })
    .join("");
}

function getDisplayWidth(value: string, cjkWidth: number): number {
  return Array.from(value).reduce((width, character) => width + getCharacterDisplayWidth(character, cjkWidth), 0);
}

function isEastAsianWideCharacter(codePoint: number): boolean {
  return (
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
  );
}

function getCharacterDisplayWidth(character: string, cjkWidth: number): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) {
    return 0;
  }

  if (isEastAsianWideCharacter(codePoint)) {
    return cjkWidth;
  }

  return 1;
}
