/* eslint-disable no-unused-vars */
export interface MemoBoxAiSecretStorage {
  get(key: string): PromiseLike<string | undefined>;
  store(key: string, value: string): PromiseLike<void>;
  delete(key: string): PromiseLike<void>;
}

let secretStorage: MemoBoxAiSecretStorage | undefined;

export function initializeMemoBoxAiSecrets(storage: MemoBoxAiSecretStorage): void {
  secretStorage = storage;
}

export function resetMemoBoxAiSecretsForTest(): void {
  secretStorage = undefined;
}

export function getMemoBoxAiSecretKey(profileName: string): string {
  return `memobox.ai.profiles.${profileName}.apiKey`;
}

export async function readMemoBoxAiSecret(profileName: string): Promise<string> {
  if (!secretStorage) {
    return "";
  }

  return (await secretStorage.get(getMemoBoxAiSecretKey(profileName)))?.trim() ?? "";
}

export async function storeMemoBoxAiSecret(profileName: string, apiKey: string): Promise<void> {
  if (!secretStorage) {
    throw new Error("MemoBox AI SecretStorage is not available.");
  }

  await secretStorage.store(getMemoBoxAiSecretKey(profileName), apiKey.trim());
}

export async function clearMemoBoxAiSecret(profileName: string): Promise<boolean> {
  if (!secretStorage) {
    throw new Error("MemoBox AI SecretStorage is not available.");
  }

  const key = getMemoBoxAiSecretKey(profileName);
  const existingValue = await secretStorage.get(key);
  if (existingValue === undefined) {
    return false;
  }

  await secretStorage.delete(key);
  return existingValue.trim() !== "";
}
