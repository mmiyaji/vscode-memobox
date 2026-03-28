import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let memoBoxExtensionPath: string | undefined;

/** Call from extension activate so templates resolve under package root (reliable vs. bundled __dirname). */
export function initializeMemoBoxWebviewTemplates(extensionPath: string): void {
  memoBoxExtensionPath = extensionPath;
}

export function loadWebviewTemplate(relativePath: string): string {
  const fullPath = resolveWebviewTemplatePath(relativePath);
  const content = readFileSync(fullPath, "utf8");

  return content;
}

export type TemplateLoopItem = Record<string, string | number | boolean>;

export interface TemplateKeyUsage {
  readonly variables: ReadonlySet<string>;
  readonly loops: ReadonlySet<string>;
}

export function extractTemplateKeys(template: string): TemplateKeyUsage {
  const variables = new Set<string>();
  const loops = new Set<string>();

  for (const match of template.matchAll(/\{\{#each\s+([A-Z_]+)\}\}/g)) {
    loops.add(match[1]!);
  }

  for (const match of template.matchAll(/\{\{([A-Z_]+)\}\}/g)) {
    variables.add(match[1]!);
  }

  return { variables, loops };
}

export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>,
  loops?: Record<string, readonly TemplateLoopItem[]>
): string {
  const afterLoops = loops ? expandLoops(template, loops) : template;
  return afterLoops.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => variables[key] ?? match);
}

function expandLoops(
  template: string,
  loops: Record<string, readonly TemplateLoopItem[]>
): string {
  return template.replace(
    /\{\{#each\s+([A-Z_]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, key: string, body: string) => {
      const items = loops[key];
      if (!items) {
        return "";
      }
      return items
        .map((item, index) => expandLoopBody(body, item, index, items.length))
        .join("");
    }
  );
}

function expandLoopBody(
  body: string,
  item: TemplateLoopItem,
  index: number,
  total: number
): string {
  return body.replace(
    /\{\{\.([a-zA-Z_]+)\}\}/g,
    (_match, prop: string) => {
      if (prop === "_index") {
        return String(index);
      }
      if (prop === "_first") {
        return index === 0 ? "true" : "";
      }
      if (prop === "_last") {
        return index === total - 1 ? "true" : "";
      }
      const value = item[prop];
      return value !== undefined ? escapeLoopValue(value) : "";
    }
  );
}

function escapeLoopValue(value: string | number | boolean): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveWebviewTemplatePath(relativePath: string): string {
  const candidates: string[] = [];
  if (memoBoxExtensionPath !== undefined) {
    candidates.push(resolve(memoBoxExtensionPath, "resources", "webview", relativePath));
  }
  candidates.push(resolve(__dirname, "../resources/webview", relativePath));
  candidates.push(resolve(__dirname, "../../resources/webview", relativePath));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0]!;
}
