export interface ResolveResult {
  /** Resolved packages in dependency order (lowest priority first) */
  packages: ResolvedPackage[];
  /** Warnings about resolution */
  warnings: string[];
}

export interface ResolvedPackage {
  reference: string;
  digest: string;
  dependencies: string[];
}

export interface Lockfile {
  lockVersion: 1;
  specVersion: string;
  packages: Record<string, LockfileEntry>;
}

export interface LockfileEntry {
  digest: string;
  dependencies: string[];
}

export interface MergeResult {
  /** Merged layers by type */
  mcp?: unknown;
  skills?: unknown[];
  rules?: unknown[];
  knowledge?: unknown[];
  surfaces?: unknown[];
  secrets?: unknown[];
  /** Merge warnings */
  warnings: string[];
}
