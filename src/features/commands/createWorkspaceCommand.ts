import * as vscode from "vscode";
import { access } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { writeMemoWorkspaceFile, getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../../core/meta/memoWorkspace";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { logMemoBoxError, logMemoBoxInfo } from "../../shared/logging";

export async function createWorkspaceCommand(
  options: {
    readonly openAfterCreate?: boolean;
    readonly quiet?: boolean;
  } = {}
): Promise<string | undefined> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return undefined;
  }

  const workspaceFilePath = await writeMemoWorkspaceFile(settings, {
    workspaceFilePath: getMemoWorkspaceFilePath(settings.memodir, `${getDefaultWorkspaceName()}.code-workspace`),
    folderName: "MemoBox",
    adminOpenOnStartup: true
  });

  if (options.openAfterCreate) {
    logMemoBoxInfo("workspace", "Workspace file created.", { workspaceFilePath, openAfterCreate: true });
    await openWorkspaceFile(workspaceFilePath);
    return workspaceFilePath;
  }

  if (options.quiet) {
    logMemoBoxInfo("workspace", "Workspace file created quietly.", { workspaceFilePath });
    return workspaceFilePath;
  }

  logMemoBoxInfo("workspace", "Workspace file created.", { workspaceFilePath });

  const action = await vscode.window.showInformationMessage(
    `MemoBox: Workspace file created at ${workspaceFilePath}.`,
    "Open Workspace",
    "Reveal File"
  );

  if (action === "Open Workspace") {
    await openWorkspaceFile(workspaceFilePath);
  } else if (action === "Reveal File") {
    await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(workspaceFilePath));
  }

  return workspaceFilePath;
}

export async function openWorkspaceFile(workspaceFilePath: string): Promise<void> {
  try {
    await access(workspaceFilePath);
    await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(workspaceFilePath), false);
    logMemoBoxInfo("workspace", "Opened workspace file.", { workspaceFilePath });
  } catch (error) {
    logMemoBoxError("workspace", "Failed to open workspace file.", {
      workspaceFilePath,
      message: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
