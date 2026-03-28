import type { MemoSnippetDefinition } from "../meta/memoAssets";

export interface SlashCommandContext {
  readonly query: string;
  readonly replaceStartCharacter: number;
}

export interface MemoSlashCommandDescriptor {
  readonly label: string;
  readonly detail: string;
  readonly snippet: string;
}

const builtinMemoSlashCommandsByLanguage = {
  en: [
    { label: "h2", detail: "Insert a level-2 heading", snippet: "## ${1:Heading}" },
    { label: "h3", detail: "Insert a level-3 heading", snippet: "### ${1:Heading}" },
    { label: "todo", detail: "Insert a todo bullet", snippet: "- @todo: ${1:Task}" },
    { label: "code", detail: "Insert a fenced code block", snippet: "```$1\n$0\n```" },
    { label: "quote", detail: "Insert a blockquote", snippet: "> ${1:Quote}" },
    { label: "table", detail: "Insert a Markdown table", snippet: "| ${1:Column} | ${2:Column} |\n| --- | --- |\n| ${3:Value} | ${4:Value} |" },
    { label: "footnote", detail: "Insert a footnote reference", snippet: "[^${1:1}]" }
  ],
  ja: [
    { label: "h2", detail: "レベル 2 の見出しを挿入", snippet: "## ${1:見出し}" },
    { label: "h3", detail: "レベル 3 の見出しを挿入", snippet: "### ${1:見出し}" },
    { label: "todo", detail: "todo 箇条書きを挿入", snippet: "- @todo: ${1:タスク}" },
    { label: "code", detail: "コードブロックを挿入", snippet: "```$1\n$0\n```" },
    { label: "quote", detail: "引用ブロックを挿入", snippet: "> ${1:引用}" },
    { label: "table", detail: "Markdown テーブルを挿入", snippet: "| ${1:列} | ${2:列} |\n| --- | --- |\n| ${3:値} | ${4:値} |" },
    { label: "footnote", detail: "脚注参照を挿入", snippet: "[^${1:1}]" }
  ]
} as const satisfies Record<"en" | "ja", readonly MemoSlashCommandDescriptor[]>;

export function getMemoSlashCommands(
  language: "en" | "ja",
  snippetDefinitions: readonly MemoSnippetDefinition[] = []
): readonly MemoSlashCommandDescriptor[] {
  const descriptors = new Map<string, MemoSlashCommandDescriptor>();

  for (const builtin of builtinMemoSlashCommandsByLanguage[language]) {
    descriptors.set(builtin.label, builtin);
  }

  for (const definition of snippetDefinitions) {
    for (const prefix of definition.prefixes) {
      const normalizedPrefix = prefix.trim();
      if (normalizedPrefix === "" || /\s/u.test(normalizedPrefix)) {
        continue;
      }

      descriptors.set(normalizedPrefix, {
        label: normalizedPrefix,
        detail: definition.description.trim() || definition.name,
        snippet: definition.body
      });
    }
  }

  return [...descriptors.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export function detectSlashCommandContext(linePrefix: string): SlashCommandContext | undefined {
  const match = linePrefix.match(/(?:^|\s)\/([a-z0-9-]*)$/iu);
  if (!match) {
    return undefined;
  }

  const query = match[1] ?? "";
  return {
    query,
    replaceStartCharacter: linePrefix.length - query.length - 1
  };
}
