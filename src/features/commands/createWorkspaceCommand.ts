import * as vscode from "vscode";
import { access } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { writeMemoWorkspaceFile, getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../../core/meta/memoWorkspace";
import { ensureMemoRoot } from "../../core/memo/workspace";

export async function createWorkspaceCommand(options: { readonly openAfterCreate?: boolean } = {}): Promise<string | undefined> {
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
    await openWorkspaceFile(workspaceFilePath);
    return workspaceFilePath;
  }

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
  await access(workspaceFilePath);
  await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(workspaceFilePath), false);
}
