import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdapterConfig } from "@stax/core";
import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";
import claudeCode, { materialize as renderClaudeCode } from "@stax/claude-code";
import codex, { materialize as renderCodex } from "@stax/codex";
import cursor, { materialize as renderCursor } from "@stax/cursor";
import githubCopilot, { materialize as renderGitHubCopilot } from "@stax/github-copilot";
import openclaw, { materialize as renderOpenClaw } from "@stax/openclaw";
import opencode, { materialize as renderOpenCode } from "@stax/opencode";
import windsurf, { materialize as renderWindsurf } from "@stax/windsurf";
import { materialize } from "./materialize.ts";
import type {
  ApplyMaterializationResult,
  MaterializationWarning,
  MaterializeOptions,
  RenderedFile,
  RenderedMaterialization,
} from "./types.ts";

interface AdapterRenderer {
  config: () => AdapterConfig;
  render: (context: MaterializeContext) => Promise<MaterializeResult>;
}

const ADAPTER_RENDERERS: Record<string, AdapterRenderer> = {
  "claude-code": {
    config: () => claudeCode(),
    render: renderClaudeCode,
  },
  codex: {
    config: () => codex(),
    render: renderCodex,
  },
  cursor: {
    config: () => cursor(),
    render: renderCursor,
  },
  "github-copilot": {
    config: () => githubCopilot(),
    render: renderGitHubCopilot,
  },
  openclaw: {
    config: () => openclaw(),
    render: renderOpenClaw,
  },
  opencode: {
    config: () => opencode(),
    render: renderOpenCode,
  },
  windsurf: {
    config: () => windsurf(),
    render: renderWindsurf,
  },
};

function renderGeneric(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  if (context.prompt) {
    files.set("INSTRUCTIONS.md", context.prompt);
  }
  return Promise.resolve({ files, warnings: [] });
}

function getSelectedAdapterConfig(type: string, fallback: AdapterConfig): AdapterConfig {
  if (type === fallback.type) return fallback;
  if (type === "generic") {
    return {
      type: "generic",
      runtime: "generic",
      adapterVersion: "1.0.0",
      importMode: "filesystem",
      fidelity: "best-effort",
      config: {},
      features: {},
      targets: [
        { kind: "file", path: "INSTRUCTIONS.md", scope: "project", description: "Instructions" },
      ],
    };
  }

  const adapter = ADAPTER_RENDERERS[type];
  if (!adapter) {
    throw new Error(`No adapter renderer registered for "${type}"`);
  }

  return adapter.config();
}

function createRenderContext(
  rendered: Awaited<ReturnType<typeof materialize>>,
  outDir: string,
  adapterConfig: AdapterConfig,
): MaterializeContext {
  return {
    outDir,
    prompt: rendered.prompt,
    persona: rendered.persona,
    mcp: rendered.mcp,
    skills: rendered.skills,
    rules: rendered.rules,
    knowledge: rendered.knowledge,
    surfaces: rendered.surfaces,
    subagents: rendered.subagents,
    secrets: rendered.secrets,
    memory: rendered.memory,
    instructionTree: rendered.instructionTree,
    adapterConfig: adapterConfig.config,
    adapterType: adapterConfig.type,
  };
}

function toWarnings(strings: string[]): MaterializationWarning[] {
  return strings.map((message) => ({
    code: "ADAPTER_WARNING",
    message,
  }));
}

function serializeFiles(files: Map<string, string | Uint8Array>): RenderedFile[] {
  return [...files.entries()].map(([filePath, content]) => ({
    path: filePath,
    content,
  }));
}

export async function renderMaterialization(
  options: MaterializeOptions,
): Promise<RenderedMaterialization> {
  const rendered = await materialize(options);
  const adapterType = options.adapter ?? rendered.config.adapter.type;
  const selectedAdapter = getSelectedAdapterConfig(adapterType, rendered.config.adapter);
  const renderer =
    adapterType === "generic" ? renderGeneric : ADAPTER_RENDERERS[adapterType]?.render;

  if (!renderer) {
    throw new Error(`No adapter renderer registered for "${adapterType}"`);
  }

  const result = await renderer(createRenderContext(rendered, options.outDir, selectedAdapter));
  const files = serializeFiles(result.files);
  const warnings = [...rendered.warnings, ...toWarnings(result.warnings)];
  const fidelity = selectedAdapter.fidelity ?? rendered.config.adapter.fidelity ?? "best-effort";

  return {
    agent: rendered,
    adapter: selectedAdapter,
    files,
    warnings,
    fidelity,
    lossy: fidelity === "best-effort" || warnings.length > 0,
  };
}

function sanitizeOutputPath(targetPath: string): string {
  const normalized = targetPath
    .replace(/^~\//, "")
    .replace(/^\/+/, "")
    .split(/[\\/]+/)
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    .join("/");

  if (!normalized) {
    throw new Error(`Cannot materialize empty target path derived from "${targetPath}"`);
  }

  return normalized;
}

export async function applyMaterialization(
  rendered: RenderedMaterialization,
  outDir: string,
): Promise<ApplyMaterializationResult> {
  const written: string[] = [];

  for (const file of rendered.files) {
    const relativePath = sanitizeOutputPath(file.path);
    const destination = path.join(outDir, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content);
    written.push(relativePath);
  }

  return {
    outDir,
    written,
  };
}
