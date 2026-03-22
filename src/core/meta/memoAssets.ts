import { access, copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { areSameMemoPaths, getDefaultTemplatePath, getPreferredTemplatePath } from "../memo/pathing";

export interface MemoTemplateAsset {
  readonly absolutePath: string;
  readonly name: string;
  readonly size: number;
  readonly updatedAt: Date;
}

export interface MemoSnippetAsset {
  readonly absolutePath: string;
  readonly name: string;
  readonly size: number;
  readonly updatedAt: Date;
  readonly snippets: readonly MemoSnippetDefinition[];
  readonly loadError?: string;
}

export interface MemoSnippetDefinition {
  readonly name: string;
  readonly prefixes: readonly string[];
  readonly description: string;
  readonly body: string;
}

export interface NewMemoTemplateSelectionOption {
  readonly kind: "default" | "template";
  readonly absolutePath?: string;
  readonly name: string;
  readonly isDefault: boolean;
}

export interface NewMemoTemplateSelectionPlan {
  readonly mode: "default" | "template" | "pick";
  readonly templatePath?: string;
  readonly options: readonly NewMemoTemplateSelectionOption[];
}

type RawSnippetEntry = {
  readonly prefix?: string | readonly string[];
  readonly body?: string | readonly string[];
  readonly description?: string;
};

export function getTemplatesDirectory(settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "templatesDir">): string {
  if (settings.templatesDir.trim() !== "") {
    return normalize(settings.templatesDir);
  }

  return normalize(join(settings.memodir, settings.metaDir, "templates"));
}

export function getSnippetsDirectory(settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "snippetsDir">): string {
  if (settings.snippetsDir.trim() !== "") {
    return normalize(settings.snippetsDir);
  }

  return normalize(join(settings.memodir, settings.metaDir, "snippets"));
}

export async function ensureMemoMetaDirectories(settings: MemoBoxSettings): Promise<void> {
  await ensureMemoAssetDirectories(getTemplatesDirectory(settings), getSnippetsDirectory(settings));
}

export async function ensureMemoAssetDirectories(templatesDirectory: string, snippetsDirectory: string): Promise<void> {
  await mkdir(templatesDirectory, { recursive: true });
  await mkdir(snippetsDirectory, { recursive: true });
  await scaffoldBundledMemoAssets(templatesDirectory, snippetsDirectory);
}

export async function listTemplateAssets(settings: MemoBoxSettings): Promise<readonly MemoTemplateAsset[]> {
  return await listDirectoryAssets(getTemplatesDirectory(settings), [".md"], async (entryPath, entryName, fileInfo) => ({
    absolutePath: entryPath,
    name: entryName,
    size: Number(fileInfo.size),
    updatedAt: fileInfo.mtime
  }));
}

export async function listSnippetAssets(settings: MemoBoxSettings): Promise<readonly MemoSnippetAsset[]> {
  return await listDirectoryAssets(getSnippetsDirectory(settings), [".json"], async (entryPath, entryName, fileInfo) => {
    try {
      const definitions = await readSnippetDefinitions(entryPath);
      return {
        absolutePath: entryPath,
        name: entryName,
        size: Number(fileInfo.size),
        updatedAt: fileInfo.mtime,
        snippets: definitions
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse snippet file";
      return {
        absolutePath: entryPath,
        name: entryName,
        size: Number(fileInfo.size),
        updatedAt: fileInfo.mtime,
        snippets: [],
        loadError: message
      };
    }
  });
}

export async function readSnippetDefinitions(filePath: string): Promise<readonly MemoSnippetDefinition[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, RawSnippetEntry>;

  return Object.entries(parsed)
    .flatMap(([name, entry]) => createSnippetDefinition(name, entry))
    .sort((left, right) => left.prefixes[0]!.localeCompare(right.prefixes[0]!));
}

export function buildNewMemoTemplateSelectionPlan(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "memotemplate">,
  assets: readonly MemoTemplateAsset[]
): NewMemoTemplateSelectionPlan {
  if (assets.length === 0) {
    return {
      mode: "default",
      options: []
    };
  }

  const preferredTemplatePath = getPreferredTemplatePath(settings);
  const hasExplicitDefaultTemplate = settings.memotemplate.trim() !== "";

  if (assets.length === 1) {
    const onlyAsset = assets[0]!;
    if (!hasExplicitDefaultTemplate && !areSameMemoPaths(onlyAsset.absolutePath, getDefaultTemplatePath(settings))) {
      return {
        mode: "template",
        templatePath: onlyAsset.absolutePath,
        options: []
      };
    }

    return {
      mode: "default",
      options: []
    };
  }

  return {
    mode: "pick",
    options: [
      {
        kind: "default",
        absolutePath: preferredTemplatePath,
        name: "Default template",
        isDefault: true
      },
      ...assets.map((asset) => ({
        kind: "template" as const,
        absolutePath: asset.absolutePath,
        name: asset.name,
        isDefault: areSameMemoPaths(asset.absolutePath, preferredTemplatePath)
      }))
    ]
  };
}

async function listDirectoryAssets<T>(
  directoryPath: string,
  extensions: readonly string[],
  // eslint-disable-next-line no-unused-vars
  mapAsset: (entryPath: string, entryName: string, fileInfo: Awaited<ReturnType<typeof stat>>) => Promise<T>
): Promise<readonly T[]> {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const assets = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && extensions.includes(extname(entry.name).toLowerCase()))
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(async (entry) => {
          const entryPath = normalize(join(directoryPath, entry.name));
          const fileInfo = await stat(entryPath);
          return await mapAsset(entryPath, entry.name, fileInfo);
        })
    );

    return assets;
  } catch {
    return [];
  }
}

function createSnippetDefinition(name: string, entry: RawSnippetEntry): readonly MemoSnippetDefinition[] {
  if (!entry || typeof entry !== "object") {
    return [];
  }

  const prefixes = normalizePrefixes(entry.prefix);
  const body = normalizeBody(entry.body);
  if (prefixes.length === 0 || body === "") {
    return [];
  }

  return [
    {
      name,
      prefixes,
      description: entry.description?.trim() ?? "",
      body
    }
  ];
}

function normalizePrefixes(prefix: RawSnippetEntry["prefix"]): readonly string[] {
  if (typeof prefix === "string") {
    return prefix.trim() === "" ? [] : [prefix.trim()];
  }

  if (Array.isArray(prefix)) {
    return prefix.flatMap((value) => (typeof value === "string" && value.trim() !== "" ? [value.trim()] : []));
  }

  return [];
}

function normalizeBody(body: RawSnippetEntry["body"]): string {
  if (typeof body === "string") {
    return body;
  }

  if (Array.isArray(body)) {
    return body.filter((value): value is string => typeof value === "string").join("\n");
  }

  return "";
}

async function scaffoldBundledMemoAssets(templatesDirectory: string, snippetsDirectory: string): Promise<void> {
  const scaffoldRoot = await resolveBundledScaffoldRoot();
  if (!scaffoldRoot) {
    return;
  }

  await copyDirectoryFilesIfMissing(normalize(join(scaffoldRoot, "templates")), templatesDirectory);
  await copyDirectoryFilesIfMissing(normalize(join(scaffoldRoot, "snippets")), snippetsDirectory);
}

async function copyDirectoryFilesIfMissing(sourceDirectory: string, targetDirectory: string): Promise<void> {
  try {
    const entries = await readdir(sourceDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      await copyFileIfMissing(
        normalize(join(sourceDirectory, entry.name)),
        normalize(join(targetDirectory, entry.name))
      );
    }
  } catch {
    // Ignore missing scaffold directories.
  }
}

async function copyFileIfMissing(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await access(targetPath);
    return;
  } catch {
    await copyFile(sourcePath, targetPath);
  }
}

async function resolveBundledScaffoldRoot(): Promise<string | undefined> {
  const candidates = [
    resolve(__dirname, "../../../resources/scaffold"),
    resolve(__dirname, "../resources/scaffold")
  ];

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) {
        return normalize(candidate);
      }
    } catch {
      // Try the next candidate.
    }
  }

  return undefined;
}
