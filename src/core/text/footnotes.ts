export function getNextFootnoteNumber(documentText: string): number {
  let highest = 0;
  for (const match of documentText.matchAll(/\[\^(\d+)\]/gu)) {
    highest = Math.max(highest, Number(match[1] ?? 0));
  }
  for (const match of documentText.matchAll(/^\[\^(\d+)\]:/gmu)) {
    highest = Math.max(highest, Number(match[1] ?? 0));
  }
  return highest + 1;
}

export function buildFootnoteInsertion(documentText: string): {
  readonly reference: string;
  readonly definitionBlock: string;
} {
  const nextNumber = getNextFootnoteNumber(documentText);
  return {
    reference: `[^${nextNumber}]`,
    definitionBlock: `\n\n[^${nextNumber}]: `
  };
}
