import test from "node:test";
import assert from "node:assert/strict";

import { buildFootnoteInsertion, getNextFootnoteNumber } from "../src/core/text/footnotes";

test("getNextFootnoteNumber finds the next available numeric footnote id", () => {
  const next = getNextFootnoteNumber("Text[^1]\n\n[^1]: first\n[^3]: third");
  assert.equal(next, 4);
});

test("buildFootnoteInsertion returns matching reference and definition", () => {
  const insertion = buildFootnoteInsertion("Text[^1]\n\n[^1]: first");
  assert.deepEqual(insertion, {
    reference: "[^2]",
    definitionBlock: "\n\n[^2]: "
  });
});
