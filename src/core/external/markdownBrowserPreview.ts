import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, posix, win32 } from "node:path";
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
  const title = getPathModule(document.fileName || "").basename(document.fileName || "Markdown Preview");
  const sourceDirectory = getSourceDirectoryHref(document.uri);
  const { frontmatter, markdownBody } = splitFrontmatter(document.getText());
  const renderedMarkdown = markdownRenderer.render(markdownBody);

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

      .frontmatter {
        margin-bottom: 24px;
        padding: 16px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        background: #f6f8fa;
      }

      .frontmatter-label {
        display: inline-block;
        margin-bottom: 10px;
        color: #57606a;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
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

        .frontmatter {
          border-color: #30363d;
          background: #161b22;
        }

        .frontmatter-label {
          color: #9da7b3;
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
      ${
        frontmatter === undefined
          ? ""
          : `<section class="frontmatter"><span class="frontmatter-label">Frontmatter</span><pre><code class="language-yaml">${escapeHtml(frontmatter)}</code></pre></section>`
      }
      <article>
        ${renderedMarkdown}
      </article>
    </main>
  </body>
</html>`;
}

function getDocumentSlug(document: Pick<MarkdownPreviewDocument, "fileName" | "uri">): string {
  const fileName = getPathModule(document.fileName || "").basename(document.fileName || "untitled");
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const suffix = document.uri.scheme === "file" ? "" : `-${document.uri.scheme}`;

  return (normalized || "markdown-preview") + suffix;
}

function splitFrontmatter(markdownText: string): { readonly frontmatter?: string; readonly markdownBody: string } {
  if (!markdownText.startsWith("---\n") && !markdownText.startsWith("---\r\n")) {
    return { markdownBody: markdownText };
  }

  const lines = markdownText.split(/\r?\n/u);
  if (lines[0] !== "---") {
    return { markdownBody: markdownText };
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] !== "---") {
      continue;
    }

    const frontmatter = lines.slice(1, index).join("\n");
    const markdownBody = lines.slice(index + 1).join("\n");
    return {
      frontmatter,
      markdownBody
    };
  }

  return { markdownBody: markdownText };
}

function getSourceDirectoryHref(uri: UriLike): string {
  if (uri.scheme !== "file" || !uri.fsPath) {
    return "";
  }

  const directoryPath = getPathModule(uri.fsPath).dirname(uri.fsPath);
  const normalizedDirectoryPath = isWindowsLikePath(directoryPath)
    ? directoryPath.replaceAll("\\", "/")
    : directoryPath;
  const fileUrl = new URL("file:///");

  fileUrl.pathname = normalizedDirectoryPath.startsWith("/") ? normalizedDirectoryPath : `/${normalizedDirectoryPath}`;
  return fileUrl.toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPathModule(filePath: string): typeof win32 | typeof posix {
  return isWindowsLikePath(filePath) ? win32 : posix;
}

function isWindowsLikePath(filePath: string): boolean {
  return /^[a-zA-Z]:[\\/]/u.test(filePath) || filePath.includes("\\");
}
