import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { logMemoBoxError, logMemoBoxInfo, logMemoBoxWarn } from "./logging";

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
      logMemoBoxInfo("safeWrite", "Wrote file safely.", {
        filePath,
        usedTransientBackup: movedOriginal
      });
    } catch (error) {
      if (movedOriginal) {
        await renameWithRetry(backupPath, filePath).catch(() => undefined);
      }
      logMemoBoxError("safeWrite", "Failed while replacing the target file.", {
        filePath,
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    logMemoBoxError("safeWrite", "Safe write failed.", {
      filePath,
      message: error instanceof Error ? error.message : String(error)
    });
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

  const retrySchedule = [0, 25, 75, 150];

  for (const [attempt, delayMs] of retrySchedule.entries()) {
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

      logMemoBoxWarn("safeWrite", "Retrying rename after a transient filesystem error.", {
        sourcePath,
        targetPath,
        attempt: attempt + 1,
        delayMs,
        code: nodeError.code
      });
    }
  }

  throw lastError;
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
