import { buildRelativeMarkdownMemoLink, buildRelativeMemoLinkReference } from "../../core/memo/memoLinks";

export interface MemoLinkCompletionContext {
  readonly kind: "wikilinkLike" | "markdownTarget";
  readonly query: string;
  readonly replaceStartCharacter: number;
}

export function detectMemoLinkCompletionContext(linePrefix: string): MemoLinkCompletionContext | undefined {
  const closedWikiLikeMatch = linePrefix.match(/\[\[([^\]]+)\]\]$/u);
  if (closedWikiLikeMatch) {
    return {
      kind: "wikilinkLike",
      query: closedWikiLikeMatch[1] ?? "",
      replaceStartCharacter: linePrefix.length - closedWikiLikeMatch[0].length
    };
  }

  const wikiLikeMatch = linePrefix.match(/\[\[([^\]]*)$/u);
  if (wikiLikeMatch) {
    return {
      kind: "wikilinkLike",
      query: wikiLikeMatch[1] ?? "",
      replaceStartCharacter: linePrefix.length - wikiLikeMatch[0].length
    };
  }

  const markdownTargetMatch = linePrefix.match(/\[[^\]]+\]\(([^)]*)$/u);
  if (markdownTargetMatch) {
    return {
      kind: "markdownTarget",
      query: markdownTargetMatch[1] ?? "",
      replaceStartCharacter: linePrefix.length - (markdownTargetMatch[1]?.length ?? 0)
    };
  }

  return undefined;
}

export function buildMemoLinkCompletionText(
  context: MemoLinkCompletionContext,
  currentMemoPath: string,
  targetMemoPath: string,
  targetLabel: string
): string {
  if (context.kind === "markdownTarget") {
    return buildRelativeMemoLinkReference(currentMemoPath, targetMemoPath);
  }

  return buildRelativeMarkdownMemoLink(currentMemoPath, targetMemoPath, targetLabel);
}

export function shouldTriggerMemoLinkSuggest(insertedText: string): boolean {
  return insertedText.length === 1 && /[[\]()\w\-./]/u.test(insertedText);
}
