export interface MemoFrontmatterMetadata {
  readonly title?: string;
  readonly tags: readonly string[];
}

export function extractMemoFrontmatterMetadata(content: string): MemoFrontmatterMetadata {
  const frontmatter = extractFrontmatterBlock(content);
  if (!frontmatter) {
    return { tags: [] };
  }

  const lines = frontmatter.split(/\r?\n/u);
  const title = parseScalarValue(findScalarField(lines, "title"));
  const tags = parseTags(lines);

  return {
    title: title || undefined,
    tags
  };
}

function extractFrontmatterBlock(content: string): string | undefined {
  if (!content.startsWith("---")) {
    return undefined;
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n?/u);
  return match?.[1];
}

function findScalarField(lines: readonly string[], key: string): string | undefined {
  const prefix = `${key}:`;

  for (const line of lines) {
    if (!line.startsWith(prefix)) {
      continue;
    }

    return line.slice(prefix.length).trim();
  }

  return undefined;
}

function parseTags(lines: readonly string[]): readonly string[] {
  const inlineValue = findScalarField(lines, "tags");
  if (inlineValue && inlineValue !== "") {
    return normalizeTags(parseInlineTags(inlineValue));
  }

  const startIndex = lines.findIndex((line) => line.trim() === "tags:");
  if (startIndex < 0) {
    return [];
  }

  const values: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.startsWith("  - ") && !line.startsWith("- ")) {
      break;
    }

    values.push(line.replace(/^\s*-\s*/u, ""));
  }

  return normalizeTags(values);
}

function parseInlineTags(value: string): readonly string[] {
  const normalized = value.trim();

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    return normalized
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim());
  }

  if (normalized.includes(",")) {
    return normalized.split(",").map((item) => item.trim());
  }

  return [normalized];
}

function parseScalarValue(value: string | undefined): string {
  const normalized = (value ?? "").trim();
  if (normalized.length < 2) {
    return normalized;
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
}

function normalizeTags(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const value of values) {
    const tag = parseScalarValue(value).trim();
    if (tag === "") {
      continue;
    }

    const normalized = tag.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    tags.push(tag);
  }

  return tags;
}
