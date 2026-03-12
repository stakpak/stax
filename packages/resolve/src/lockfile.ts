import { readFile } from "node:fs/promises";
import type { Lockfile } from "./types.ts";

export function createLockfile(resolved: {
  packages: { reference: string; digest: string; dependencies: string[] }[];
}): Lockfile {
  const packages: Record<string, { digest: string; dependencies: string[] }> = {};
  for (const pkg of resolved.packages) {
    packages[pkg.reference] = {
      digest: pkg.digest,
      dependencies: pkg.dependencies,
    };
  }

  return {
    lockVersion: 1,
    specVersion: "1.0.0",
    packages,
  };
}

export async function readLockfile(filePath: string): Promise<Lockfile> {
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    throw new Error(`Lockfile not found: ${filePath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Malformed lockfile JSON: ${filePath}`);
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.lockVersion !== 1) {
    throw new Error(`Invalid lockVersion: ${obj.lockVersion}. Expected 1`);
  }

  return parsed as Lockfile;
}
