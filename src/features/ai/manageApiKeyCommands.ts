import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { applyMemoBoxAiContextKeys } from "../../infra/ai/contextKeys";
import { resolveMemoBoxAiConfigurationWithSecrets } from "../../infra/ai/configuration";
import { clearMemoBoxAiSecret, storeMemoBoxAiSecret } from "../../infra/ai/secrets";

export async function setAiApiKeyCommand(): Promise<void> {
  const settings = readSettings();
  if (!settings.aiEnabled) {
    void vscode.window.showWarningMessage("MemoBox: AI is disabled. Enable memobox.aiEnabled first.");
    return;
  }

  const profileName = settings.ai.defaultProfile;
  const profile = settings.ai.profiles[profileName];
  if (!profile) {
    void vscode.window.showWarningMessage("MemoBox: The active AI profile is missing.");
    return;
  }

  const value = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    password: true,
    prompt: `Store an API key for the AI profile "${profileName}" in VS Code SecretStorage`,
    placeHolder: profile.provider === "openai" ? "Paste the API key" : "Optional API key"
  });
  if (value === undefined) {
    return;
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    void vscode.window.showWarningMessage("MemoBox: The API key was empty. Nothing was stored.");
    return;
  }

  await storeMemoBoxAiSecret(profileName, trimmedValue);
  await applyMemoBoxAiContextKeys();
  void vscode.window.showInformationMessage(`MemoBox: Stored an AI API key for profile "${profileName}".`);
}

export async function clearAiApiKeyCommand(): Promise<void> {
  const settings = readSettings();
  const profileName = settings.ai.defaultProfile;
  const resolved = await resolveMemoBoxAiConfigurationWithSecrets(settings);
  const provider = resolved.profile?.provider ?? settings.ai.profiles[profileName]?.provider ?? "openai";

  const confirmation = await vscode.window.showWarningMessage(
    `Remove the SecretStorage API key for AI profile "${profileName}"?`,
    {
      modal: true,
      detail: provider === "openai"
        ? "The profile may stop working if it does not also provide apiKey or apiKeyEnv."
        : "This removes only the SecretStorage entry. Provider settings remain unchanged."
    },
    "Remove"
  );
  if (confirmation !== "Remove") {
    return;
  }

  const removed = await clearMemoBoxAiSecret(profileName);
  await applyMemoBoxAiContextKeys();
  void vscode.window.showInformationMessage(
    removed
      ? `MemoBox: Cleared the stored AI API key for profile "${profileName}".`
      : `MemoBox: No stored AI API key was found for profile "${profileName}".`
  );
}
