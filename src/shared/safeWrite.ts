import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeFileSafely(filePath: string, data: string): Promise<void> {
  const parentDir = dirname(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const backupPath = `${filePath}.bak-write`;

  await mkdir(parentDir, { recursive: true });

  try {
    await writeFile(tempPath, data, "utf8");

    await rm(backupPath, { force: true }).catch(() => undefined);
    let movedOriginal = false;

    try {
      await rename(filePath, backupPath);
      movedOriginal = true;
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await rename(tempPath, filePath);
      if (movedOriginal) {
        await rm(backupPath, { force: true }).catch(() => undefined);
      }
    } catch (error) {
      if (movedOriginal) {
        await rename(backupPath, filePath).catch(() => undefined);
      }
      throw error;
    }
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}
