import { join, normalize } from "node:path";
import type { MemoBoxSettings } from "../config/types";
import { extensionId } from "../config/constants";
import { ensureMemoAssetDirectories } from "./memoAssets";
import { writeFileSafely } from "../../shared/safeWrite";

const markdownRecommendations = ["yzhang.markdown-all-in-one"] as const;

export function getMemoWorkspaceFilePath(memodir: string, workspaceFileName = "MemoBox.code-workspace"): string {
  return normalize(join(memodir, workspaceFileName));
}

export function buildMemoWorkspaceContent(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "templatesDir" | "snippetsDir">,
  options: {
    readonly folderName?: string;
    readonly adminOpenOnStartup?: boolean;
  } = {}
): string {
  const folderName = options.folderName?.trim() || "MemoBox";
  const data = {
    folders: [
      {
        path: normalize(settings.memodir),
        name: folderName
      }
    ],
    settings: {
      "memobox.adminOpenOnStartup": options.adminOpenOnStartup ?? true,
      "memobox.templatesDir": getWorkspaceTemplatesDirectory(settings.memodir),
      "memobox.snippetsDir": getWorkspaceSnippetsDirectory(settings.memodir),
      "markdown.copyFiles.destination": {
        "*": "assets/${isoTime/^(\\d+)-(\\d+)-(\\d+)T(\\d+):(\\d+):(\\d+).+/$1$2$3-$4$5$6/}.${fileExtName}"
      }
    },
    extensions: {
      recommendations: [extensionId, ...markdownRecommendations]
    }
  };

  return `${JSON.stringify(data, null, 2)}\n`;
}

export async function writeMemoWorkspaceFile(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir" | "templatesDir" | "snippetsDir">,
  options: {
    readonly workspaceFilePath?: string;
    readonly folderName?: string;
    readonly adminOpenOnStartup?: boolean;
  } = {}
): Promise<string> {
  const workspaceFilePath = options.workspaceFilePath
    ? normalize(options.workspaceFilePath)
    : getMemoWorkspaceFilePath(settings.memodir, `${getDefaultWorkspaceName()}.code-workspace`);

  await ensureMemoAssetDirectories(
    getWorkspaceTemplatesDirectory(settings.memodir),
    getWorkspaceSnippetsDirectory(settings.memodir)
  );

  await writeFileSafely(
    workspaceFilePath,
    buildMemoWorkspaceContent(settings, {
      folderName: options.folderName,
      adminOpenOnStartup: options.adminOpenOnStartup
    })
  );

  return workspaceFilePath;
}

export function getDefaultWorkspaceName(): string {
  return "MemoBox";
}

export function getWorkspaceTemplatesDirectory(memodir: string): string {
  return normalize(join(memodir, ".templates"));
}

export function getWorkspaceSnippetsDirectory(memodir: string): string {
  return normalize(join(memodir, ".snippets"));
}
