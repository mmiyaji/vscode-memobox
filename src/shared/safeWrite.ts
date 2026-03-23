import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const retryableRenameErrorCodes = new Set(["EBUSY", "EPERM", "UNKNOWN"]);

export async function writeFileSafely(filePath: string, data: string): Promise<void> {
  const parentDir = dirname(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const backupPath = getTransientBackupFilePath(filePath);

  await mkdir(parentDir, { recursive: true });

  try {
    await writeFile(tempPath, data, "utf8");

    await rm(backupPath, { force: true }).catch(() => undefined);
    let movedOriginal = false;

    try {
      await renameWithRetry(filePath, backupPath);
      movedOriginal = true;
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await renameWithRetry(tempPath, filePath);
      if (movedOriginal) {
        await rm(backupPath, { force: true }).catch(() => undefined);
      }
    } catch (error) {
      if (movedOriginal) {
        await renameWithRetry(backupPath, filePath).catch(() => undefined);
      }
      throw error;
    }
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export function getPersistentBackupFilePath(filePath: string): string {
  return `${filePath}.bk`;
}

export function getTransientBackupFilePath(filePath: string): string {
  return `${filePath}.bak-write`;
}

async function renameWithRetry(sourcePath: string, targetPath: string): Promise<void> {
  let lastError: unknown;

  for (const delayMs of [0, 25, 75, 150]) {
    if (delayMs > 0) {
      await delay(delayMs);
    }

    try {
      await rename(sourcePath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      const nodeError = error as NodeJS.ErrnoException;
      if (!nodeError.code || !retryableRenameErrorCodes.has(nodeError.code)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
