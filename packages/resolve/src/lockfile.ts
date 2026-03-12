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

export function readLockfile(_path: string): Lockfile {
  throw new Error("Not implemented");
}
