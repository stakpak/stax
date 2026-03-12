import { access, lstat, readdir } from "node:fs/promises";
import path from "node:path";
import type {
  BuildOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./types.ts";

const NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** Path fields that are required (error if missing) */
const REQUIRED_PATH_FIELDS = [
  "prompt",
  "persona",
  "mcp",
  "skills",
  "rules",
  "knowledge",
  "surfaces",
  "instructionTree",
  "subagents",
] as const;

/** Path fields that are optional (warning if missing) */
const OPTIONAL_PATH_FIELDS = ["memory"] as const;

export async function validate(
  options: Pick<BuildOptions, "entry" | "symlinkMode" | "allowOutsideRoot">,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const entryPath = path.resolve(options.entry);

  // 1. Check entry file exists
  try {
    await access(entryPath);
  } catch {
    return {
      valid: false,
      errors: [
        {
          path: entryPath,
          message: `Entry file not found: ${entryPath}`,
          code: "ENTRY_NOT_FOUND",
        },
      ],
      warnings: [],
    };
  }

  // 2. Dynamic import the entry file
  let mod: Record<string, unknown>;
  try {
    mod = await import(entryPath);
  } catch (err) {
    return {
      valid: false,
      errors: [
        {
          path: entryPath,
          message: `Failed to import entry file: ${err instanceof Error ? err.message : String(err)}`,
          code: "INVALID_ENTRY",
        },
      ],
      warnings: [],
    };
  }

  // 3. Check default export
  if (!("default" in mod) || mod.default === undefined || mod.default === null) {
    return {
      valid: false,
      errors: [
        {
          path: entryPath,
          message: "Entry file must have a default export",
          code: "NO_DEFAULT_EXPORT",
        },
      ],
      warnings: [],
    };
  }

  const def = mod.default as Record<string, unknown>;
  const projectRoot = path.dirname(entryPath);

  // 4. Validate schema fields
  // Name
  if (typeof def.name !== "string" || !NAME_REGEX.test(def.name)) {
    errors.push({
      path: entryPath,
      message: `Invalid name "${def.name}". Must match ${NAME_REGEX}`,
      code: "INVALID_NAME",
    });
  }

  // Version
  if (typeof def.version !== "string" || !SEMVER_REGEX.test(def.version)) {
    errors.push({
      path: entryPath,
      message: `Invalid version "${def.version}". Must be valid semver`,
      code: "INVALID_VERSION",
    });
  }

  // Description
  if (typeof def.description !== "string" || def.description.length === 0) {
    errors.push({
      path: entryPath,
      message: "Description must be a non-empty string",
      code: "EMPTY_DESCRIPTION",
    });
  }

  // Adapter
  if (!def.adapter || typeof def.adapter !== "object") {
    errors.push({
      path: entryPath,
      message: "Adapter configuration is required",
      code: "MISSING_ADAPTER",
    });
  }

  // Tags uniqueness
  if (Array.isArray(def.tags)) {
    const tagSet = new Set(def.tags as string[]);
    if (tagSet.size !== def.tags.length) {
      errors.push({
        path: entryPath,
        message: "Tags must be unique",
        code: "DUPLICATE_TAGS",
      });
    }
  }

  // 5. Validate path references (required fields)
  for (const field of REQUIRED_PATH_FIELDS) {
    const value = def[field];
    if (typeof value === "string") {
      const resolved = path.resolve(projectRoot, value);
      try {
        await access(resolved);
      } catch {
        errors.push({
          path: resolved,
          message: `Referenced path for "${field}" does not exist: ${resolved}`,
          code: "MISSING_PATH",
        });
      }
    }
  }

  // Optional path fields (warning instead of error)
  for (const field of OPTIONAL_PATH_FIELDS) {
    const value = def[field];
    if (typeof value === "string") {
      const resolved = path.resolve(projectRoot, value);
      try {
        await access(resolved);
      } catch {
        warnings.push({
          path: resolved,
          message: `Optional path for "${field}" does not exist: ${resolved}`,
          code: "OPTIONAL_MISSING_PATH",
        });
      }
    }
  }

  // 6. Symlink validation
  const symlinkMode = options.symlinkMode ?? "reject";
  if (symlinkMode === "reject") {
    const allPathFields = [...REQUIRED_PATH_FIELDS, ...OPTIONAL_PATH_FIELDS] as readonly string[];
    for (const field of allPathFields) {
      const value = def[field as keyof typeof def];
      if (typeof value === "string") {
        const resolved = path.resolve(projectRoot, value as string);
        try {
          await access(resolved);
          const symlinks = await findSymlinks(resolved);
          for (const symlinkPath of symlinks) {
            errors.push({
              path: symlinkPath,
              message: `Symlink found at "${symlinkPath}" and symlinkMode is "reject"`,
              code: "SYMLINK_FOUND",
            });
          }
        } catch {
          // Path doesn't exist, already handled above
        }
      }
    }
  }

  // 7. Validate package references
  if (Array.isArray(def.packages)) {
    for (let i = 0; i < def.packages.length; i++) {
      const ref = def.packages[i] as string;
      if (typeof ref !== "string" || ref.trim().length === 0 || /^\s+$/.test(ref)) {
        errors.push({
          path: entryPath,
          message: `Invalid package reference at index ${i}: "${ref}"`,
          code: "INVALID_PACKAGE_REF",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function findSymlinks(targetPath: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const stats = await lstat(targetPath);
    if (stats.isSymbolicLink()) {
      results.push(targetPath);
      return results;
    }
    if (stats.isDirectory()) {
      const entries = await readdir(targetPath);
      for (const entry of entries) {
        const fullPath = path.join(targetPath, entry);
        const childSymlinks = await findSymlinks(fullPath);
        results.push(...childSymlinks);
      }
    }
  } catch {
    // ignore errors walking
  }
  return results;
}
