import * as vscode from "vscode";

export function getGlobalConfigurationTarget(): vscode.ConfigurationTarget {
  return vscode.ConfigurationTarget.Global;
}

export function getMemoBoxConfigurationTarget(): vscode.ConfigurationTarget {
  return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
}
