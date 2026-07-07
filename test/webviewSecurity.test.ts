import test from "node:test";
import assert from "node:assert/strict";
import { createCspNonce, escapeHtml } from "../src/shared/webviewSecurity";

test("escapeHtml escapes HTML metacharacters", () => {
  assert.equal(escapeHtml("<button data-open-file=\"x\">It's</button>"), "&lt;button data-open-file=&quot;x&quot;&gt;It&#39;s&lt;/button&gt;");
});

test("createCspNonce returns a strong base64 nonce", () => {
  const nonce = createCspNonce();

  assert.match(nonce, /^[A-Za-z0-9+/]+={0,2}$/u);
  assert.equal(Buffer.from(nonce, "base64").byteLength, 16);
});
