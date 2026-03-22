import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";

const previewDirectoryName = "memobox";
const markdownExtensions = new Set([".md", ".markdown", ".mdown", ".mkd"]);

const markdownRenderer = new MarkdownIt({
  html: true,
  linkify: true
});

interface UriLike {
  readonly scheme: string;
  readonly fsPath?: string;
}

interface MarkdownPreviewDocument {
  readonly languageId?: string;
  readonly fileName: string;
  readonly uri: UriLike;
  getText(): string;
}

export function isMarkdownDocument(document: Pick<MarkdownPreviewDocument, "languageId" | "fileName">): boolean {
  if (document.languageId === "markdown") {
    return true;
  }

  return markdownExtensions.has(extname(document.fileName).toLowerCase());
}

export async function writeMarkdownBrowserPreview(document: MarkdownPreviewDocument): Promise<string> {
  const previewDirectory = join(tmpdir(), previewDirectoryName);
  const previewFileName = `${getDocumentSlug(document)}-preview.html`;
  const previewFilePath = join(previewDirectory, previewFileName);
  const html = renderMarkdownBrowserPreviewHtml(document);

  await mkdir(previewDirectory, { recursive: true });
  await writeFile(previewFilePath, html, "utf8");

  return previewFilePath;
}

export function renderMarkdownBrowserPreviewHtml(document: Pick<MarkdownPreviewDocument, "getText" | "fileName" | "uri">): string {
  const title = basename(document.fileName || "Markdown Preview");
  const sourceDirectory = getSourceDirectoryHref(document.uri);
  const renderedMarkdown = markdownRenderer.render(document.getText());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${sourceDirectory === "" ? "" : `<base href="${escapeHtml(sourceDirectory)}" />`}
    <style>
      :root {
        color-scheme: light dark;
      }

      body {
        margin: 0;
        background: #ffffff;
        color: #24292f;
        font: 16px/1.7 "Segoe UI", system-ui, sans-serif;
      }

      main {
        max-width: 860px;
        margin: 0 auto;
        padding: 40px 24px 64px;
      }

      article {
        overflow-wrap: anywhere;
      }

      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.8em;
        margin-bottom: 0.6em;
        line-height: 1.25;
      }

      p, ul, ol, pre, blockquote, table {
        margin-top: 0;
        margin-bottom: 1em;
      }

      a {
        color: #0969da;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      code, pre {
        font-family: "Cascadia Code", Consolas, monospace;
      }

      code {
        padding: 0.15em 0.35em;
        border-radius: 4px;
        background: #f6f8fa;
      }

      pre {
        padding: 16px;
        overflow-x: auto;
        border-radius: 6px;
        background: #f6f8fa;
      }

      pre code {
        padding: 0;
        background: transparent;
      }

      blockquote {
        margin-left: 0;
        padding-left: 16px;
        border-left: 4px solid #d0d7de;
        color: #57606a;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 8px 12px;
        border: 1px solid #d0d7de;
        text-align: left;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #1e1e1e;
          color: #d4d4d4;
        }

        a {
          color: #58a6ff;
        }

        code,
        pre {
          background: #161b22;
        }

        blockquote {
          border-left-color: #30363d;
          color: #9da7b3;
        }

        th,
        td {
          border-color: #30363d;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <article>
        ${renderedMarkdown}
      </article>
    </main>
  </body>
</html>`;
}

function getDocumentSlug(document: Pick<MarkdownPreviewDocument, "fileName" | "uri">): string {
  const fileName = basename(document.fileName || "untitled");
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const suffix = document.uri.scheme === "file" ? "" : `-${document.uri.scheme}`;

  return (normalized || "markdown-preview") + suffix;
}

function getSourceDirectoryHref(uri: UriLike): string {
  if (uri.scheme !== "file" || !uri.fsPath) {
    return "";
  }

  return pathToFileURL(dirname(uri.fsPath)).toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
