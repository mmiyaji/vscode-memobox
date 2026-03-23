import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { resolveMemoBoxAiConfigurationWithSecrets } from "./configuration";

export async function applyMemoBoxAiContextKeys(): Promise<void> {
  const settings = readSettings();
  const resolved = await resolveMemoBoxAiConfigurationWithSecrets(settings);

  await vscode.commands.executeCommand("setContext", "memobox.aiEnabled", settings.aiEnabled);
  await vscode.commands.executeCommand("setContext", "memobox.aiConfigured", resolved.configured);
}
