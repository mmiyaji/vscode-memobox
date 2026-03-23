const frontmatterFence = "---";

export function setFrontmatterScalar(text: string, key: string, value: string): string {
  return rewriteFrontmatter(text, (lines) => upsertYamlBlock(lines, key, [`${key}: ${toSingleQuotedYamlScalar(value)}`]));
}

export function setFrontmatterStringList(text: string, key: string, values: readonly string[]): string {
  const blockLines = [`${key}:`, ...values.map((value) => `  - ${toYamlListScalar(value)}`)];
  return rewriteFrontmatter(text, (lines) => upsertYamlBlock(lines, key, blockLines));
}

export function updateFirstHeading(text: string, title: string): string {
  const section = splitFrontmatter(text);
  const bodyLines = section.body.split(/\r?\n/u);
  const firstHeadingIndex = bodyLines.findIndex((line) => /^#\s+/u.test(line));

  if (firstHeadingIndex >= 0) {
    bodyLines[firstHeadingIndex] = `# ${title}`;
  } else {
    bodyLines.unshift(`# ${title}`, "");
  }

  return joinFrontmatter(section.frontmatterLines, bodyLines.join("\n"));
}

// eslint-disable-next-line no-unused-vars
function rewriteFrontmatter(text: string, update: (lines: readonly string[]) => readonly string[]): string {
  const section = splitFrontmatter(text);
  return joinFrontmatter(update(section.frontmatterLines), section.body);
}

function splitFrontmatter(text: string): { readonly frontmatterLines: readonly string[]; readonly body: string } {
  const normalizedText = text.replace(/\r\n/g, "\n");
  if (!normalizedText.startsWith(`${frontmatterFence}\n`)) {
    return { frontmatterLines: [], body: normalizedText };
  }

  const closingFenceIndex = normalizedText.indexOf(`\n${frontmatterFence}\n`, frontmatterFence.length + 1);
  if (closingFenceIndex < 0) {
    return { frontmatterLines: [], body: normalizedText };
  }

  const frontmatterBlock = normalizedText.slice(frontmatterFence.length + 1, closingFenceIndex);
  const body = normalizedText.slice(closingFenceIndex + frontmatterFence.length + 2);
  return {
    frontmatterLines: frontmatterBlock === "" ? [] : frontmatterBlock.split("\n"),
    body
  };
}

function joinFrontmatter(frontmatterLines: readonly string[], body: string): string {
  if (frontmatterLines.length === 0) {
    return body;
  }

  return `${frontmatterFence}\n${frontmatterLines.join("\n")}\n${frontmatterFence}\n${body}`;
}

function upsertYamlBlock(lines: readonly string[], key: string, blockLines: readonly string[]): readonly string[] {
  const sanitizedLines = removeYamlBlock(lines, key).filter((line, index, values) => {
    if (line.trim() !== "") {
      return true;
    }

    return values[index - 1]?.trim() !== "";
  });

  return sanitizedLines.length > 0 ? [...sanitizedLines, ...blockLines] : [...blockLines];
}

function removeYamlBlock(lines: readonly string[], key: string): readonly string[] {
  const result: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!new RegExp(`^${escapeForRegExp(key)}:`).test(lines[index] ?? "")) {
      result.push(lines[index] ?? "");
      continue;
    }

    index += 1;
    while (index < lines.length && !/^[A-Za-z0-9_-]+:/u.test(lines[index] ?? "")) {
      index += 1;
    }
    index -= 1;
  }

  return result;
}

function toSingleQuotedYamlScalar(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function toYamlListScalar(value: string): string {
  return /^[A-Za-z0-9/_-]+$/u.test(value) ? value : toSingleQuotedYamlScalar(value);
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
