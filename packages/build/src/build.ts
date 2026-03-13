import { readFile, readdir, stat, lstat, realpath, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { createPackageLayerPayload } from "@stax/core";
import { ARTIFACT_TYPE_AGENT, CONFIG_MEDIA_TYPES, LAYER_MEDIA_TYPES, LAYER_ORDER } from "@stax/oci";
import { canonicalJson } from "./canonical-json.ts";
import { createDeterministicTarGz } from "./archive.ts";
import type { BuildOptions, BuildResult, LayerResult } from "./types.ts";

/** Directories to always ignore when walking */
const IGNORE_DIRS = new Set([".git", ".stax", "node_modules"]);

interface OciLayer {
  mediaType: string;
  digest: string;
  size: number;
}

function sha256(data: Uint8Array | string): string {
  const hash = createHash("sha256");
  hash.update(typeof data === "string" ? data : Buffer.from(data));
  return hash.digest("hex");
}

function orderIndex(mediaType: string): number {
  const idx = (LAYER_ORDER as readonly string[]).indexOf(mediaType);
  return idx === -1 ? LAYER_ORDER.length : idx;
}

/**
 * Parse .staxignore file and return patterns
 */
function parseStaxIgnore(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

/**
 * Simple glob match supporting * and ** patterns
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple glob: *.ext matches any file with that extension
  if (pattern.startsWith("*.")) {
    const ext = pattern.slice(1);
    return filePath.endsWith(ext);
  }
  // Direct name match
  if (!pattern.includes("/") && !pattern.includes("*")) {
    const basename = path.basename(filePath);
    return basename === pattern;
  }
  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{DOUBLESTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{DOUBLESTAR\}\}/g, ".*");
  return new RegExp(`^${regexStr}$`).test(filePath);
}

/**
 * Walk a directory recursively, collecting files as Map<relativePath, content>
 */
async function walkDir(
  dirPath: string,
  options: {
    symlinkMode: "reject" | "flatten";
    ignorePatterns: string[];
    outDir?: string;
  },
): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  await walkDirRecursive(dirPath, "", files, options);
  return files;
}

async function walkDirRecursive(
  basePath: string,
  relativePath: string,
  files: Map<string, Uint8Array>,
  options: {
    symlinkMode: "reject" | "flatten";
    ignorePatterns: string[];
    outDir?: string;
  },
): Promise<void> {
  const fullPath = relativePath ? path.join(basePath, relativePath) : basePath;
  const entries = await readdir(fullPath);

  for (const entry of entries.sort()) {
    const entryRelative = relativePath ? `${relativePath}/${entry}` : entry;
    const entryFull = path.join(fullPath, entry);

    // Skip ignored directories
    if (IGNORE_DIRS.has(entry)) continue;

    // Skip outDir
    if (options.outDir && path.resolve(entryFull) === path.resolve(options.outDir)) continue;

    // Check staxignore patterns
    if (
      options.ignorePatterns.some(
        (p) => matchesPattern(entryRelative, p) || matchesPattern(entry, p),
      )
    ) {
      continue;
    }

    const stats = await lstat(entryFull);

    if (stats.isSymbolicLink()) {
      if (options.symlinkMode === "reject") {
        throw new Error(`Symlink found at "${entryFull}" and symlinkMode is "reject"`);
      }
      // flatten: read through the symlink
      const realTarget = await realpath(entryFull);
      const realStats = await stat(realTarget);
      if (realStats.isFile()) {
        const content = await readFile(realTarget);
        files.set(entryRelative, new Uint8Array(content));
      }
      // If symlink points to directory, skip for now (flatten only resolves file symlinks)
    } else if (stats.isDirectory()) {
      await walkDirRecursive(basePath, entryRelative, files, options);
    } else if (stats.isFile()) {
      const content = await readFile(entryFull);
      files.set(entryRelative, new Uint8Array(content));
    }
  }
}

export async function build(options: BuildOptions): Promise<BuildResult> {
  const entryPath = path.resolve(options.entry);
  const projectRoot = path.dirname(entryPath);
  const outDir = options.outDir ?? path.join(projectRoot, ".stax", "artifacts");
  const symlinkMode = options.symlinkMode ?? "reject";
  const warnings: string[] = [];

  // 1. Load entry file
  let mod: Record<string, unknown>;
  try {
    mod = await import(entryPath);
  } catch (err) {
    throw new Error(
      `Failed to import entry file "${entryPath}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!("default" in mod) || !mod.default) {
    throw new Error(`Entry file "${entryPath}" must have a default export`);
  }

  const def = mod.default as Record<string, unknown>;

  // 2. Load .staxignore patterns
  let ignorePatterns: string[] = [];
  try {
    const ignoreContent = await readFile(path.join(projectRoot, ".staxignore"), "utf-8");
    ignorePatterns = parseStaxIgnore(ignoreContent);
  } catch {
    // No .staxignore file
  }

  // 3. Create outDir
  const blobsDir = path.join(outDir, "blobs", "sha256");
  await mkdir(blobsDir, { recursive: true });

  // 4. Build layers
  const layers: OciLayer[] = [];

  async function writeBlob(data: Uint8Array | string): Promise<{ digest: string; size: number }> {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hash = sha256(bytes);
    await writeFile(path.join(blobsDir, hash), bytes);
    return { digest: `sha256:${hash}`, size: bytes.length };
  }

  // JSON layer fields (read from file, produce canonical JSON)
  const jsonFileFields: Array<{ field: string; mediaType: string }> = [
    { field: "persona", mediaType: LAYER_MEDIA_TYPES.persona },
    { field: "mcp", mediaType: LAYER_MEDIA_TYPES.mcp },
    { field: "subagents", mediaType: LAYER_MEDIA_TYPES.subagents },
  ];

  for (const { field, mediaType } of jsonFileFields) {
    const value = def[field];
    if (typeof value === "string") {
      const filePath = path.resolve(projectRoot, value);
      // Check outside root
      if (options.allowOutsideRoot === false && !filePath.startsWith(projectRoot)) {
        throw new Error(`Path "${value}" references outside project root`);
      }
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      const canonical = canonicalJson(parsed);
      const blob = await writeBlob(canonical);
      layers.push({ mediaType, ...blob });
    }
  }

  // Secrets (inline in definition, not a file path)
  if (Array.isArray(def.secrets) && def.secrets.length > 0) {
    const canonical = canonicalJson(def.secrets);
    const blob = await writeBlob(canonical);
    layers.push({ mediaType: LAYER_MEDIA_TYPES.secrets, ...blob });
  }

  // Packages (inline in definition) — spec 03 requires structured format
  if (Array.isArray(def.packages) && def.packages.length > 0) {
    const packagesPayload = createPackageLayerPayload(
      (def.specVersion as string) ?? "1.0.0",
      def.packages as string[],
    );
    const canonical = canonicalJson(packagesPayload);
    const blob = await writeBlob(canonical);
    layers.push({ mediaType: LAYER_MEDIA_TYPES.packages, ...blob });
  }

  // Markdown layer (prompt)
  if (typeof def.prompt === "string") {
    const filePath = path.resolve(projectRoot, def.prompt);
    if (options.allowOutsideRoot === false && !filePath.startsWith(projectRoot)) {
      throw new Error(`Path "${def.prompt}" references outside project root`);
    }
    const content = await readFile(filePath, "utf-8");
    const blob = await writeBlob(content);
    layers.push({ mediaType: LAYER_MEDIA_TYPES.prompt, ...blob });
  }

  // Tar+gzip layers (directories)
  const tarFields: Array<{ field: string; mediaType: string }> = [
    { field: "skills", mediaType: LAYER_MEDIA_TYPES.skills },
    { field: "rules", mediaType: LAYER_MEDIA_TYPES.rules },
    { field: "knowledge", mediaType: LAYER_MEDIA_TYPES.knowledge },
    { field: "memory", mediaType: LAYER_MEDIA_TYPES.memory },
    { field: "surfaces", mediaType: LAYER_MEDIA_TYPES.surfaces },
    { field: "instructionTree", mediaType: LAYER_MEDIA_TYPES.instructionTree },
  ];

  for (const { field, mediaType } of tarFields) {
    const value = def[field];
    if (typeof value === "string") {
      const dirPath = path.resolve(projectRoot, value);
      if (options.allowOutsideRoot === false && !dirPath.startsWith(projectRoot)) {
        throw new Error(`Path "${value}" references outside project root`);
      }
      const files = await walkDir(dirPath, { symlinkMode, ignorePatterns, outDir });
      if (files.size === 0) {
        warnings.push(`Directory "${value}" is empty, producing empty layer`);
      }
      const tarGz = await createDeterministicTarGz(files);
      const blob = await writeBlob(tarGz);
      layers.push({ mediaType, ...blob });
    }
  }

  // 5. Sort layers by canonical order
  layers.sort((a, b) => orderIndex(a.mediaType) - orderIndex(b.mediaType));

  // 6. Build config blob
  const adapterDef = def.adapter as Record<string, unknown>;
  const config: Record<string, unknown> = {
    specVersion: (def.specVersion as string) ?? "1.0.0",
    kind: "agent",
    name: def.name as string,
    version: def.version as string,
    description: def.description as string,
  };

  // Include optional identity fields when declared
  if (def.author !== undefined) config.author = def.author;
  if (def.license !== undefined) config.license = def.license;
  if (def.url !== undefined) config.url = def.url;
  if (def.tags !== undefined) config.tags = def.tags;

  // Include full adapter config
  const adapterConfig: Record<string, unknown> = {
    type: adapterDef?.type as string,
    runtime: adapterDef?.runtime as string,
    adapterVersion: adapterDef?.adapterVersion as string,
  };
  if (adapterDef?.model !== undefined) adapterConfig.model = adapterDef.model;
  if (adapterDef?.modelParams !== undefined) adapterConfig.modelParams = adapterDef.modelParams;
  if (adapterDef?.importMode !== undefined) adapterConfig.importMode = adapterDef.importMode;
  if (adapterDef?.fidelity !== undefined) adapterConfig.fidelity = adapterDef.fidelity;
  if (adapterDef?.config !== undefined) adapterConfig.config = adapterDef.config;
  if (adapterDef?.features !== undefined) adapterConfig.features = adapterDef.features;
  if (adapterDef?.targets !== undefined) adapterConfig.targets = adapterDef.targets;
  if (adapterDef?.runtimeVersionRange !== undefined)
    adapterConfig.runtimeVersionRange = adapterDef.runtimeVersionRange;
  config.adapter = adapterConfig;

  // Include adapter fallback when declared
  if (def.adapterFallback !== undefined) config.adapterFallback = def.adapterFallback;

  // Include runtime hints and workspace sources when declared
  if (def.hints !== undefined) config.hints = def.hints;
  if (def.workspaceSources !== undefined) config.workspaceSources = def.workspaceSources;
  const configCanonical = canonicalJson(config);
  const configBlob = await writeBlob(configCanonical);

  // 7. Build manifest with annotations
  const annotations: Record<string, string> = {
    "org.opencontainers.image.created": "1970-01-01T00:00:00.000Z",
    "org.opencontainers.image.version": def.version as string,
    "org.opencontainers.image.title": def.name as string,
    "dev.stax.spec.version": (def.specVersion as string) ?? "1.0.0",
    "dev.stax.adapter.type": (def.adapter as Record<string, unknown>)?.type as string,
    "dev.stax.adapter.runtime": (def.adapter as Record<string, unknown>)?.runtime as string,
  };

  const manifest = {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType: ARTIFACT_TYPE_AGENT,
    config: {
      mediaType: CONFIG_MEDIA_TYPES.agent,
      digest: configBlob.digest,
      size: configBlob.size,
    },
    layers,
    annotations,
  };

  const manifestJson = canonicalJson(manifest);
  const manifestDigest = `sha256:${sha256(manifestJson)}`;

  // 8. Write manifest
  await writeFile(path.join(outDir, "manifest.json"), manifestJson);

  // 9. Build layer results
  const layerResults: LayerResult[] = layers.map((l) => ({
    mediaType: l.mediaType,
    digest: l.digest,
    size: l.size,
  }));

  return {
    digest: manifestDigest,
    artifactPath: outDir,
    layers: layerResults,
    warnings,
  };
}
