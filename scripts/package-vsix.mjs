import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const out = `memobox-${pkg.version}.vsix`;
  const rootDir = fileURLToPath(new URL('..', import.meta.url));
  const vsceEntry = join(rootDir, 'node_modules', '@vscode', 'vsce', 'vsce');

  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [vsceEntry, 'package', '--out', out],
      {
        stdio: 'inherit',
        cwd: rootDir,
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`vsce package failed with exit code ${code ?? -1}`));
    });
    child.on('error', reject);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
