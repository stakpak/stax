import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

export function emptyDirectory(directory: string): string[] {
  const removed: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    rmSync(entryPath, { force: true, recursive: true });
    removed.push(entryPath);
  }

  return removed;
}

export function isBunCompileTempArtifact(name: string): boolean {
  return name.startsWith(".") && name.includes(".bun-build");
}

export function cleanBunCompileTempArtifacts(directory: string): string[] {
  const removed: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!isBunCompileTempArtifact(entry.name)) {
      continue;
    }

    const artifactPath = join(directory, entry.name);
    rmSync(artifactPath, { force: true, recursive: true });
    removed.push(artifactPath);
  }

  return removed;
}
