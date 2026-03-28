import test from "node:test";
import assert from "node:assert/strict";

import { formatMarkdownTable } from "../src/core/text/formatMarkdownTable";

test("formatMarkdownTable aligns a basic markdown table", () => {
  const result = formatMarkdownTable([
    "| Name | Status |",
    "| --- | --- |",
    "| alpha | open |",
    "| beta | closed |"
  ].join("\n"));

  assert.equal(result, [
    "| Name  | Status |",
    "| ----- | ------ |",
    "| alpha | open   |",
    "| beta  | closed |"
  ].join("\n"));
});
