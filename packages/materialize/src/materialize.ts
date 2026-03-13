import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { pull, LAYER_MEDIA_TYPES } from "@stax/oci";
import type { OciManifest } from "@stax/oci";
import { resolvePackages, mergeLayers } from "@stax/resolve";
import { renderPromptTemplates } from "./templates.ts";
import type {
  MaterializeOptions,
  MaterializedAgent,
  MaterializedSkill,
  MaterializedRule,
  MaterializedSurface,
  MaterializedSubagent,
  MaterializedInstructionNode,
  MaterializedKnowledgeFile,
  MaterializedMemoryFile,
  MaterializationWarning,
} from "./types.ts";
import type { PersonaDefinition, McpConfig, SecretDeclaration } from "@stax/core";

// ─── Source detection ──────────────────────────────────

function isLocalPath(source: string): boolean {
  return (
    source.startsWith("/") ||
    source.startsWith("./") ||
    source.startsWith("../") ||
    source.startsWith("~") ||
    // Check if it looks like a path on the filesystem (no registry-like pattern)
    (!source.includes(":") && source.includes(path.sep)) ||
    // Absolute paths on current OS
    path.isAbsolute(source)
  );
}

// ─── Tar extraction ────────────────────────────────────

function extractTar(data: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  let offset = 0;

  while (offset < data.length - 512) {
    const header = data.slice(offset, offset + 512);

    // Check for end-of-archive (all zeros)
    if (header.every((b) => b === 0)) break;

    // Extract filename (bytes 0-99, null-terminated)
    let nameEnd = 100;
    for (let i = 0; i < 100; i++) {
      if (header[i] === 0) {
        nameEnd = i;
        break;
      }
    }
    const name = new TextDecoder().decode(header.slice(0, nameEnd)).replace(/\u0000+$/, "");
    if (!name) break;

    // Extract size (bytes 124-135, octal, null-terminated)
    const sizeStr = new TextDecoder()
      .decode(header.slice(124, 136))
      .replace(/\u0000+$/, "")
      .trim();
    const size = parseInt(sizeStr, 8) || 0;

    // Type flag (byte 156)
    const typeFlag = header[156];

    offset += 512;

    if (size > 0) {
      // Only include regular files (type '0' or '\0')
      if (typeFlag === 0x30 || typeFlag === 0x00) {
        files.set(name, data.slice(offset, offset + size));
      }
      offset += Math.ceil(size / 512) * 512;
    }
  }

  return files;
}

// ─── Rule frontmatter parsing ──────────────────────────

interface ParsedRule {
  id: string;
  scope: string;
  priority: number;
  content: string;
}

function parseRuleFrontmatter(filename: string, text: string): ParsedRule {
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    // No frontmatter — use filename as id
    const id = filename.replace(/\.[^.]+$/, "");
    return { id, scope: "always", priority: 0, content: text.trim() };
  }

  const [, frontmatter, body] = frontmatterMatch;
  const meta: Record<string, string> = {};

  for (const line of frontmatter!.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }

  return {
    id: meta.id ?? filename.replace(/\.[^.]+$/, ""),
    scope: meta.scope ?? "always",
    priority: meta.priority ? parseInt(meta.priority, 10) : 0,
    content: body!.trim(),
  };
}

// ─── Skill name extraction ─────────────────────────────

function extractSkillName(filePath: string): string {
  // "code-review/SKILL.md" → "code-review"
  // "SKILL.md" → "SKILL"
  const parts = filePath.split("/");
  if (parts.length >= 2) {
    return parts[0]!;
  }
  return filePath.replace(/\.[^.]+$/, "");
}

// ─── Load from manifest + blobs ────────────────────────

interface LoadedArtifact {
  manifest: OciManifest;
  blobs: Map<string, Uint8Array>;
}

async function loadLocalArtifact(artifactDir: string): Promise<LoadedArtifact> {
  const manifestData = await readFile(path.join(artifactDir, "manifest.json"), "utf-8");
  const manifest: OciManifest = JSON.parse(manifestData);

  const blobs = new Map<string, Uint8Array>();

  // Load config blob
  if (manifest.config.size > 0) {
    const digest = manifest.config.digest;
    const hash = digest.replace("sha256:", "");
    const data = await readFile(path.join(artifactDir, "blobs", "sha256", hash));
    blobs.set(digest, new Uint8Array(data));
  }

  // Load layer blobs
  for (const layer of manifest.layers) {
    const hash = layer.digest.replace("sha256:", "");
    const data = await readFile(path.join(artifactDir, "blobs", "sha256", hash));
    blobs.set(layer.digest, new Uint8Array(data));
  }

  return { manifest, blobs };
}

// ─── Layer processing helpers ──────────────────────────

function getBlob(blobs: Map<string, Uint8Array>, digest: string): Uint8Array {
  const blob = blobs.get(digest);
  if (!blob) throw new Error(`Blob not found: ${digest}`);
  return blob;
}

function decodeTarGz(blob: Uint8Array): Map<string, Uint8Array> {
  const tarData = gunzipSync(Buffer.from(blob));
  return extractTar(new Uint8Array(tarData));
}

function decodeJson<T>(blob: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(blob)) as T;
}

function decodeText(blob: Uint8Array): string {
  return new TextDecoder().decode(blob);
}

// ─── Feature warning check ─────────────────────────────

function checkFeatureWarnings(
  features: Record<string, unknown>,
  layerName: string,
  featureKey: string,
): MaterializationWarning | undefined {
  const featureValue = features[featureKey];
  if (featureValue === "unsupported") {
    return {
      code: "UNSUPPORTED_FEATURE",
      message: `Feature "${featureKey}" is not supported by this adapter`,
      layer: layerName,
    };
  }
  return undefined;
}

// ─── Process layers from an artifact ───────────────────

interface ProcessedLayers {
  prompt?: string;
  persona?: PersonaDefinition;
  mcp?: McpConfig;
  skills?: MaterializedSkill[];
  rules?: MaterializedRule[];
  surfaces?: MaterializedSurface[];
  subagents?: MaterializedSubagent[];
  secrets?: SecretDeclaration[];
  knowledge?: MaterializedKnowledgeFile[];
  memory?: MaterializedMemoryFile[];
  instructionTree?: MaterializedInstructionNode[];
  packageRefs?: string[];
}

function processLayers(manifest: OciManifest, blobs: Map<string, Uint8Array>): ProcessedLayers {
  const result: ProcessedLayers = {};

  for (const layer of manifest.layers) {
    const blob = getBlob(blobs, layer.digest);

    switch (layer.mediaType) {
      case LAYER_MEDIA_TYPES.prompt:
        result.prompt = decodeText(blob);
        break;

      case LAYER_MEDIA_TYPES.persona:
        result.persona = decodeJson<PersonaDefinition>(blob);
        break;

      case LAYER_MEDIA_TYPES.mcp:
        result.mcp = decodeJson<McpConfig>(blob);
        break;

      case LAYER_MEDIA_TYPES.subagents: {
        const subagentsDef = decodeJson<{
          specVersion?: string;
          agents: Record<
            string,
            { description: string; invocation?: string; instructions: string; model?: string }
          >;
        }>(blob);
        result.subagents = Object.entries(subagentsDef.agents).map(([name, def]) => ({
          name,
          description: def.description,
          invocation: def.invocation ?? "manual",
          instructions: def.instructions,
          ...(def.model && { model: def.model }),
        }));
        break;
      }

      case LAYER_MEDIA_TYPES.secrets:
        result.secrets = decodeJson<SecretDeclaration[]>(blob);
        break;

      case LAYER_MEDIA_TYPES.packages: {
        const packagesData = decodeJson<
          | string[]
          | { specVersion?: string; packages: Array<{ ref: string; digest?: string; kind?: string }> }
        >(blob);
        // Support both legacy plain string[] and spec-compliant structured format
        if (Array.isArray(packagesData)) {
          result.packageRefs = packagesData;
        } else {
          result.packageRefs = packagesData.packages.map((p) => p.ref);
        }
        break;
      }

      case LAYER_MEDIA_TYPES.skills: {
        const files = decodeTarGz(blob);
        result.skills = [];
        for (const [filePath, content] of files) {
          result.skills.push({
            name: extractSkillName(filePath),
            path: filePath,
            content: decodeText(content),
          });
        }
        break;
      }

      case LAYER_MEDIA_TYPES.rules: {
        const files = decodeTarGz(blob);
        result.rules = [];
        for (const [filePath, content] of files) {
          const text = decodeText(content);
          const basename = filePath.split("/").pop() ?? filePath;
          const parsed = parseRuleFrontmatter(basename, text);
          result.rules.push({
            id: parsed.id,
            scope: parsed.scope,
            content: parsed.content,
            priority: parsed.priority,
          });
        }
        break;
      }

      case LAYER_MEDIA_TYPES.surfaces: {
        const files = decodeTarGz(blob);
        result.surfaces = [];
        for (const [filePath, content] of files) {
          result.surfaces.push({
            name: filePath,
            content: decodeText(content),
          });
        }
        break;
      }

      case LAYER_MEDIA_TYPES.knowledge: {
        const files = decodeTarGz(blob);
        result.knowledge = [];
        for (const [filePath, content] of files) {
          result.knowledge.push({
            path: filePath,
            content: new Uint8Array(content),
          });
        }
        break;
      }

      case LAYER_MEDIA_TYPES.memory: {
        const files = decodeTarGz(blob);
        result.memory = [];
        for (const [filePath, content] of files) {
          result.memory.push({
            path: filePath,
            content: new Uint8Array(content),
          });
        }
        break;
      }

      case LAYER_MEDIA_TYPES.instructionTree: {
        const files = decodeTarGz(blob);
        result.instructionTree = [];
        for (const [filePath, content] of files) {
          // Strip .md extension for the path
          const nodePath = filePath.replace(/\.md$/, "");
          result.instructionTree.push({
            path: nodePath,
            instructions: decodeText(content),
          });
        }
        break;
      }
    }
  }

  return result;
}

// ─── Main materialize function ─────────────────────────

export async function materialize(options: MaterializeOptions): Promise<MaterializedAgent> {
  const { source, adapter: adapterOverride, exact } = options;

  // 1. Load artifact (local or OCI)
  let artifact: LoadedArtifact;

  if (isLocalPath(source)) {
    artifact = await loadLocalArtifact(source);
  } else {
    artifact = await pull(source);
  }

  const { manifest, blobs } = artifact;

  // 2. Parse config
  const configBlob = getBlob(blobs, manifest.config.digest);
  const config = decodeJson<{
    specVersion: string;
    name: string;
    version: string;
    description: string;
    adapter: {
      type: string;
      runtime: string;
      adapterVersion: string;
      config: Record<string, unknown>;
      features: Record<string, unknown>;
      targets?: Array<{ kind: string; path: string; scope?: string; description?: string }>;
    };
  }>(configBlob);

  // 3. Apply adapter override
  const adapterType = adapterOverride ?? config.adapter.type;

  // 4. Exact mode check
  if (exact && adapterOverride && adapterOverride !== config.adapter.type) {
    throw new Error(
      `Adapter "${adapterOverride}" cannot faithfully reproduce agent built for "${config.adapter.type}" in exact mode`,
    );
  }

  // 5. Process agent layers
  const agentLayers = processLayers(manifest, blobs);

  // 6. Handle package dependencies
  let mergedRules: MaterializedRule[] | undefined;
  let mergedSkills: MaterializedSkill[] | undefined;
  let mergedSurfaces: MaterializedSurface[] | undefined;
  let mergedSecrets: SecretDeclaration[] | undefined;
  let mergedMcp: McpConfig | undefined;
  let mergedKnowledge: MaterializedKnowledgeFile[] | undefined;

  if (agentLayers.packageRefs && agentLayers.packageRefs.length > 0) {
    const resolved = await resolvePackages(agentLayers.packageRefs);
    const packageLayers: Record<string, unknown>[] = [];

    for (const pkg of resolved.packages) {
      // Pull each package
      const pkgResult = await pull(pkg.reference);
      const pkgProcessed = processLayers(pkgResult.manifest, pkgResult.blobs);
      const pkgData: Record<string, unknown> = {};

      if (pkgProcessed.rules) pkgData.rules = pkgProcessed.rules;
      if (pkgProcessed.skills) pkgData.skills = pkgProcessed.skills;
      if (pkgProcessed.surfaces) pkgData.surfaces = pkgProcessed.surfaces;
      if (pkgProcessed.secrets) pkgData.secrets = pkgProcessed.secrets;
      if (pkgProcessed.mcp) pkgData.mcp = pkgProcessed.mcp;
      if (pkgProcessed.knowledge) pkgData.knowledge = pkgProcessed.knowledge;

      packageLayers.push(pkgData);
    }

    // Add agent's own layers as highest priority (last)
    const agentData: Record<string, unknown> = {};
    if (agentLayers.rules) agentData.rules = agentLayers.rules;
    if (agentLayers.skills) agentData.skills = agentLayers.skills;
    if (agentLayers.surfaces) agentData.surfaces = agentLayers.surfaces;
    if (agentLayers.secrets) agentData.secrets = agentLayers.secrets;
    if (agentLayers.mcp) agentData.mcp = agentLayers.mcp;
    if (agentLayers.knowledge) agentData.knowledge = agentLayers.knowledge;

    packageLayers.push(agentData);

    const merged = mergeLayers(packageLayers);

    mergedRules = merged.rules as MaterializedRule[] | undefined;
    mergedSkills = merged.skills as MaterializedSkill[] | undefined;
    mergedSurfaces = merged.surfaces as MaterializedSurface[] | undefined;
    mergedSecrets = merged.secrets as SecretDeclaration[] | undefined;
    mergedMcp = merged.mcp as McpConfig | undefined;
    mergedKnowledge = merged.knowledge as MaterializedKnowledgeFile[] | undefined;
  }

  // 7. Build final layer data (merged if packages exist, otherwise raw agent layers)
  const finalRules = mergedRules ?? agentLayers.rules;
  const finalSkills = mergedSkills ?? agentLayers.skills;
  const finalSurfaces = mergedSurfaces ?? agentLayers.surfaces;
  const finalSecrets = mergedSecrets ?? agentLayers.secrets;
  const finalMcp = mergedMcp ?? agentLayers.mcp;
  const finalKnowledge = mergedKnowledge ?? agentLayers.knowledge;

  // 8. Render prompt with persona
  const features = (config.adapter.features ?? {}) as Record<string, unknown>;
  let renderedPrompt = agentLayers.prompt;
  if (renderedPrompt) {
    renderedPrompt = renderPromptTemplates(renderedPrompt, {
      persona: agentLayers.persona,
    });
  }

  // 9. Check for feature warnings
  const warnings: MaterializationWarning[] = [];

  const featureLayerMap: Array<[string, string, unknown]> = [
    ["persona", "persona", agentLayers.persona],
    ["mcp", "mcp", finalMcp],
    ["skills", "skills", finalSkills],
    ["rules", "rules", finalRules],
    ["surfaces", "surfaces", finalSurfaces],
    ["secrets", "secrets", finalSecrets],
  ];

  for (const [featureKey, layerName, layerData] of featureLayerMap) {
    if (layerData) {
      const warning = checkFeatureWarnings(features, layerName, featureKey);
      if (warning) warnings.push(warning);
    }
  }

  // 10. Build result
  const result: MaterializedAgent = {
    config: {
      specVersion: config.specVersion,
      name: config.name,
      version: config.version,
      description: config.description,
      adapter: {
        type: adapterType,
        runtime: config.adapter.runtime,
        adapterVersion: config.adapter.adapterVersion,
        config: config.adapter.config ?? {},
        features: config.adapter.features as Record<
          string,
          unknown
        > as MaterializedAgent["config"]["adapter"]["features"],
        ...(config.adapter.targets && {
          targets: config.adapter.targets as MaterializedAgent["config"]["adapter"]["targets"],
        }),
      },
    },
    warnings,
  };

  if (renderedPrompt !== undefined) result.prompt = renderedPrompt;
  if (agentLayers.persona) result.persona = agentLayers.persona;
  if (finalMcp) result.mcp = finalMcp;
  if (finalSkills) result.skills = finalSkills;
  if (finalRules) result.rules = finalRules;
  if (finalSurfaces) result.surfaces = finalSurfaces;
  if (finalSecrets) result.secrets = finalSecrets;
  if (finalKnowledge) result.knowledge = finalKnowledge;
  if (agentLayers.memory) result.memory = agentLayers.memory;
  if (agentLayers.instructionTree) result.instructionTree = agentLayers.instructionTree;
  if (agentLayers.subagents) result.subagents = agentLayers.subagents;

  return result;
}
