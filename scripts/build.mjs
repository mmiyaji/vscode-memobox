import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const watchMode = process.argv.includes("--watch");

const buildOptions = {
  absWorkingDir: rootDir,
  bundle: true,
  entryPoints: ["src/extension.ts"],
  external: ["vscode"],
  format: "cjs",
  logLevel: "info",
  outfile: "dist/extension.js",
  platform: "node",
  sourcemap: true,
  target: "node20"
};

await rm(resolve(rootDir, "dist"), { force: true, recursive: true });

if (watchMode) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log("Watching extension sources...");
} else {
  await esbuild.build(buildOptions);
}
