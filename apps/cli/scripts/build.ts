import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { cleanBunCompileTempArtifacts, emptyDirectory } from "../src/build-artifacts.ts";

const packageRoot = join(import.meta.dir, "..");
const distDirectory = join(packageRoot, "dist");

mkdirSync(distDirectory, { recursive: true });
emptyDirectory(distDirectory);

let exitCode = 1;

try {
  const result = spawnSync("bun", ["build", "../src/index.ts", "--compile", "--outfile", "stax"], {
    cwd: distDirectory,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  exitCode = result.status ?? 1;
} finally {
  cleanBunCompileTempArtifacts(distDirectory);
}

process.exit(exitCode);
