import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const textCache = new Map<string, string>();

export function loadWebviewTemplate(relativePath: string): string {
  const cached = textCache.get(relativePath);
  if (cached !== undefined) {
    return cached;
  }

  const fullPath = resolveWebviewTemplatePath(relativePath);
  const content = readFileSync(fullPath, "utf8");
  textCache.set(relativePath, content);
  return content;
}

export function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  let output = template;

  for (const [key, value] of Object.entries(variables)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }

  return output;
}

function resolveWebviewTemplatePath(relativePath: string): string {
  const candidates: [string, ...string[]] = [
    resolve(__dirname, "../resources/webview", relativePath),
    resolve(__dirname, "../../resources/webview", relativePath)
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}
