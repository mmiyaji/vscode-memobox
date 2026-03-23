import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isMarkdownDocument,
  renderMarkdownBrowserPreviewHtml,
  writeMarkdownBrowserPreview
} from "../src/core/external/markdownBrowserPreview";

test("isMarkdownDocument accepts markdown language ids and markdown extensions", () => {
  assert.equal(
    isMarkdownDocument({
      languageId: "markdown",
      fileName: "note.txt"
    }),
    true
  );

  assert.equal(
    isMarkdownDocument({
      languageId: "plaintext",
      fileName: "note.md"
    }),
    true
  );

  assert.equal(
    isMarkdownDocument({
      languageId: "plaintext",
      fileName: "note.txt"
    }),
    false
  );
});

test("renderMarkdownBrowserPreviewHtml renders markdown and base href", () => {
  const html = renderMarkdownBrowserPreviewHtml({
    getText: () => "# Title\n\n[link](./doc.md)\n\n```ts\nconst value = 1;\n```",
    fileName: "C:\\memo\\note.md",
    uri: { scheme: "file", fsPath: "C:\\memo\\note.md" }
  });

  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<base href="file:\/\//);
  assert.match(html, /<a href="\.\/doc\.md"/);
  assert.match(html, /<pre><code class="language-ts">/);
});

test("renderMarkdownBrowserPreviewHtml renders yaml frontmatter separately before markdown body", () => {
  const html = renderMarkdownBrowserPreviewHtml({
    getText: () =>
      "---\n" +
      "title: 'Example note'\n" +
      "tags:\n" +
      "  - inbox\n" +
      "---\n\n" +
      "# Title\n\n" +
      "Body text",
    fileName: "C:\\memo\\frontmatter.md",
    uri: { scheme: "file", fsPath: "C:\\memo\\frontmatter.md" }
  });

  assert.match(html, /<span class="frontmatter-label">Frontmatter<\/span>/);
  assert.match(html, /<code class="language-yaml">title: &#39;Example note&#39;\ntags:\n {2}- inbox<\/code>/);
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<p>Body text<\/p>/);
});

test("writeMarkdownBrowserPreview writes an html file for the current document contents", async () => {
  const previewPath = await writeMarkdownBrowserPreview({
    getText: () => "Hello **world**",
    fileName: "C:\\memo\\daily.md",
    uri: { scheme: "file", fsPath: "C:\\memo\\daily.md" }
  });

  const html = await readFile(previewPath, "utf8");
  assert.match(html, /<strong>world<\/strong>/);
  assert.match(html, /<title>daily\.md<\/title>/);
});
