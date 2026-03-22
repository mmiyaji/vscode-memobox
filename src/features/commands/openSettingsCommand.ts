import * as vscode from "vscode";
import { extensionId } from "../../core/config/constants";

export async function openSettingsCommand(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.openSettings", `@ext:${extensionId} memobox`);
}
