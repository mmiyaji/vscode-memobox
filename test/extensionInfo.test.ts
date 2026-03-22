import test from "node:test";
import assert from "node:assert/strict";

import { getExtensionDisplayVersion } from "../src/shared/extensionInfo";

void test("getExtensionDisplayVersion returns the provided version", () => {
  assert.equal(getExtensionDisplayVersion("0.1.0"), "0.1.0");
});

void test("getExtensionDisplayVersion falls back when version is missing", () => {
  assert.equal(getExtensionDisplayVersion(undefined), "0.0.0");
});

void test("getExtensionDisplayVersion trims whitespace", () => {
  assert.equal(getExtensionDisplayVersion(" 0.1.0 "), "0.1.0");
});
