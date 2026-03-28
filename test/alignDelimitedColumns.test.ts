import test from "node:test";
import assert from "node:assert/strict";

import { alignDelimitedColumns } from "../src/core/text/alignDelimitedColumns";

test("alignDelimitedColumns aligns comma-separated values", () => {
  const result = alignDelimitedColumns([
    "id,name,status",
    "1,alpha,open",
    "22,beta,closed"
  ].join("\n"));

  assert.ok(result);
  assert.equal(result.delimiter, ",");
  assert.equal(result.alignedText, [
    "id, name,  status",
    "1,  alpha, open",
    "22, beta,  closed"
  ].join("\n"));
});

test("alignDelimitedColumns keeps quoted commas together", () => {
  const result = alignDelimitedColumns([
    "id,name,notes",
    "1,\"alpha,beta\",ok",
    "2,gamma,\"quoted, value\""
  ].join("\n"));

  assert.ok(result);
  assert.equal(result.alignedText, [
    "id, name,         notes",
    "1,  \"alpha,beta\", ok",
    "2,  gamma,        \"quoted, value\""
  ].join("\n"));
});

test("alignDelimitedColumns detects tab-delimited selections", () => {
  const result = alignDelimitedColumns([
    "id\tname\tstatus",
    "1\talpha\topen"
  ].join("\n"));

  assert.ok(result);
  assert.equal(result.delimiter, "\t");
  assert.equal(result.alignedText, [
    "id\t name\t  status",
    "1\t  alpha\t open"
  ].join("\n"));
});

test("alignDelimitedColumns returns undefined when no delimiter is found", () => {
  assert.equal(alignDelimitedColumns("plain text only"), undefined);
});

test("alignDelimitedColumns uses display width for multibyte text (cjkWidth=2)", () => {
  const result = alignDelimitedColumns([
    "id,name,status",
    "1,山田,open",
    "22,alpha,完了"
  ].join("\n"), { eastAsianCharacterWidth: 2 });

  assert.ok(result);
  assert.equal(result.alignedText, [
    "id, name,  status",
    "1,  山田,  open",
    "22, alpha, 完了"
  ].join("\n"));
});

test("alignDelimitedColumns treats CJK as width 1 (cjkWidth=1)", () => {
  const result = alignDelimitedColumns([
    "id,name,status",
    "1,山田,open",
    "22,alpha,完了"
  ].join("\n"), { eastAsianCharacterWidth: 1 });

  assert.ok(result);
  // With cjkWidth=1, 山田=2, alpha=5 → col1 width=5; id=2, 1=1, 22=2 → col0 width=2
  assert.equal(result.alignedText, [
    "id, name,  status",
    "1,  山田,    open",
    "22, alpha, 完了"
  ].join("\n"));
});

test("alignDelimitedColumns aligns all rows even with a wide cell", () => {
  const longMultibyteValue = "\u3042".repeat(10) + "305";
  const result = alignDelimitedColumns([
    "id,name,status,owner",
    "1,alpha,open,mmiyaji",
    "22,beta,closed,satokaz",
    `${longMultibyteValue},gamma,in review,team-a`
  ].join("\n"), { eastAsianCharacterWidth: 2 });

  assert.ok(result);
  // Column 0 width = 23 (longMultibyteValue display width), all rows padded to it
  assert.equal(result.alignedText, [
    "id,                      name,  status,    owner",
    "1,                       alpha, open,      mmiyaji",
    "22,                      beta,  closed,    satokaz",
    `${longMultibyteValue}, gamma, in review, team-a`
  ].join("\n"));
});
