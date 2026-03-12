import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import type { OciManifest } from "@stax/oci";
import { LAYER_MEDIA_TYPES } from "@stax/oci";

// Mock OCI pull and resolve for package/OCI tests
vi.mock("@stax/oci", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@stax/oci")>();
  return { ...orig, pull: vi.fn() };
});

vi.mock("@stax/resolve", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@stax/resolve")>();
  return {
    ...orig,
    resolvePackages: vi.fn().mockResolvedValue({ packages: [], warnings: [] }),
    mergeLayers: orig.mergeLayers,
  };
});

// Import after mocks are set up
import { materialize } from "./materialize.ts";
import { pull } from "@stax/oci";
import { resolvePackages } from "@stax/resolve";

const mockedPull = vi.mocked(pull);
const mockedResolvePackages = vi.mocked(resolvePackages);

// ─── Helpers ───────────────────────────────────────────

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function createTarHeader(path: string, size: number): Uint8Array {
  const header = new Uint8Array(512);
  const encoder = new TextEncoder();

  const nameBytes = encoder.encode(path);
  header.set(nameBytes.slice(0, 100), 0);

  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, 0);
  header[156] = 0x30;
  const magic = encoder.encode("ustar\0");
  header.set(magic, 257);
  header[263] = 0x30;
  header[264] = 0x30;

  for (let i = 148; i < 156; i++) {
    header[i] = 0x20;
  }
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i]!;
  }
  writeOctal(header, 148, 7, checksum);
  header[155] = 0x20;

  return header;
}

function writeOctal(buf: Uint8Array, offset: number, length: number, value: number): void {
  const str = value.toString(8).padStart(length - 1, "0");
  const bytes = new TextEncoder().encode(str);
  buf.set(bytes.slice(0, length - 1), offset);
  buf[offset + length - 1] = 0;
}

function createTarGz(files: Map<string, Uint8Array>): Uint8Array {
  const sortedPaths = [...files.keys()].sort();
  const blocks: Uint8Array[] = [];

  for (const path of sortedPaths) {
    const content = files.get(path)!;
    blocks.push(createTarHeader(path, content.length));
    blocks.push(content);
    const remainder = content.length % 512;
    if (remainder > 0) {
      blocks.push(new Uint8Array(512 - remainder));
    }
  }
  blocks.push(new Uint8Array(1024));

  const totalSize = blocks.reduce((sum, b) => sum + b.length, 0);
  const tar = new Uint8Array(totalSize);
  let offset = 0;
  for (const block of blocks) {
    tar.set(block, offset);
    offset += block.length;
  }
  return new Uint8Array(gzipSync(Buffer.from(tar)));
}

interface ArtifactBlob {
  mediaType: string;
  data: Uint8Array;
}

interface CreateArtifactOpts {
  config: {
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
    };
  };
  layers?: ArtifactBlob[];
}

async function createLocalArtifact(tmpDir: string, opts: CreateArtifactOpts): Promise<string> {
  const artifactDir = join(tmpDir, "artifact-" + Math.random().toString(36).slice(2, 8));
  const blobsDir = join(artifactDir, "blobs", "sha256");
  await mkdir(blobsDir, { recursive: true });

  const configData = new TextEncoder().encode(JSON.stringify(opts.config));
  const configHash = sha256(configData);
  await writeFile(join(blobsDir, configHash), configData);

  const layers: Array<{ mediaType: string; digest: string; size: number }> = [];

  if (opts.layers) {
    for (const layer of opts.layers) {
      const hash = sha256(layer.data);
      await writeFile(join(blobsDir, hash), layer.data);
      layers.push({
        mediaType: layer.mediaType,
        digest: `sha256:${hash}`,
        size: layer.data.length,
      });
    }
  }

  const manifest: OciManifest = {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType: "application/vnd.stax.agent.v1",
    config: {
      mediaType: LAYER_MEDIA_TYPES.config,
      digest: `sha256:${configHash}`,
      size: configData.length,
    },
    layers,
  };

  await writeFile(join(artifactDir, "manifest.json"), JSON.stringify(manifest));

  return artifactDir;
}

function makePkgPullResult(
  config: Record<string, unknown>,
  layers: Array<{ mediaType: string; data: Uint8Array }>,
) {
  const configData = new TextEncoder().encode(JSON.stringify(config));
  const configHash = sha256(configData);
  const blobs = new Map<string, Uint8Array>();
  blobs.set(`sha256:${configHash}`, configData);

  const ociLayers: Array<{ mediaType: string; digest: string; size: number }> = [];
  for (const l of layers) {
    const hash = sha256(l.data);
    blobs.set(`sha256:${hash}`, l.data);
    ociLayers.push({ mediaType: l.mediaType, digest: `sha256:${hash}`, size: l.data.length });
  }

  return {
    manifest: {
      schemaVersion: 2 as const,
      mediaType: "application/vnd.oci.image.manifest.v1+json",
      artifactType: "application/vnd.stax.package.v1",
      config: {
        mediaType: LAYER_MEDIA_TYPES.config,
        digest: `sha256:${configHash}`,
        size: configData.length,
      },
      layers: ociLayers,
    },
    blobs,
  };
}

// ─── Test Data ─────────────────────────────────────────

const baseConfig = {
  specVersion: "1.0.0",
  name: "test-agent",
  version: "0.1.0",
  description: "A test agent",
  adapter: {
    type: "claude-code",
    runtime: "claude-code",
    adapterVersion: "1.0.0",
    config: {},
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "native",
      skills: "native",
      mcp: "native",
    },
  },
};

// ─── Tests ─────────────────────────────────────────────

describe("materialize", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stax-materialize-test-"));
    vi.clearAllMocks();
    // Reset default mock behavior
    mockedResolvePackages.mockResolvedValue({ packages: [], warnings: [] });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── End-to-end from local artifact ──

  it("should produce a MaterializedAgent from a local artifact path", async () => {
    const artifactDir = await createLocalArtifact(tmpDir, { config: baseConfig });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result).toBeDefined();
    expect(result.config).toBeDefined();
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("should include config with specVersion, name, version, description, adapter", async () => {
    const artifactDir = await createLocalArtifact(tmpDir, { config: baseConfig });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.config.specVersion).toBe("1.0.0");
    expect(result.config.name).toBe("test-agent");
    expect(result.config.version).toBe("0.1.0");
    expect(result.config.description).toBe("A test agent");
    expect(result.config.adapter).toBeDefined();
    expect(result.config.adapter.type).toBe("claude-code");
  });

  it("should include rendered prompt with persona values substituted", async () => {
    const promptData = new TextEncoder().encode("You are {{persona.name}}, a {{persona.role}}.");
    const personaData = new TextEncoder().encode(
      JSON.stringify({
        name: "maya",
        displayName: "Maya Chen",
        role: "Senior Engineer",
      }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [
        { mediaType: LAYER_MEDIA_TYPES.prompt, data: promptData },
        { mediaType: LAYER_MEDIA_TYPES.persona, data: personaData },
      ],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.prompt).toBe("You are maya, a Senior Engineer.");
  });

  it("should include persona definition", async () => {
    const personaData = new TextEncoder().encode(
      JSON.stringify({
        name: "maya",
        displayName: "Maya Chen",
        role: "Senior Engineer",
        background: "10 years in distributed systems",
      }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.persona, data: personaData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.persona).toBeDefined();
    expect(result.persona!.name).toBe("maya");
    expect(result.persona!.displayName).toBe("Maya Chen");
    expect(result.persona!.role).toBe("Senior Engineer");
  });

  it("should include skills extracted from skills layer", async () => {
    const skillFiles = new Map<string, Uint8Array>();
    skillFiles.set(
      "code-review/SKILL.md",
      new TextEncoder().encode("Review code for quality and correctness."),
    );
    skillFiles.set("testing/SKILL.md", new TextEncoder().encode("Write comprehensive tests."));
    const skillsBlob = createTarGz(skillFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.skills, data: skillsBlob }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.skills).toBeDefined();
    expect(result.skills!.length).toBe(2);

    const codeReview = result.skills!.find((s) => s.name === "code-review");
    expect(codeReview).toBeDefined();
    expect(codeReview!.content).toBe("Review code for quality and correctness.");

    const testing = result.skills!.find((s) => s.name === "testing");
    expect(testing).toBeDefined();
    expect(testing!.content).toBe("Write comprehensive tests.");
  });

  it("should include rules extracted from rules layer", async () => {
    const ruleFiles = new Map<string, Uint8Array>();
    ruleFiles.set(
      "no-eval.md",
      new TextEncoder().encode(
        "---\nid: no-eval\nscope: always\npriority: 100\n---\nNever use eval()",
      ),
    );
    ruleFiles.set(
      "prefer-const.md",
      new TextEncoder().encode(
        "---\nid: prefer-const\nscope: always\npriority: 50\n---\nPrefer const over let",
      ),
    );
    const rulesBlob = createTarGz(ruleFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.rules, data: rulesBlob }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.rules).toBeDefined();
    expect(result.rules!.length).toBe(2);

    const noEval = result.rules!.find((r) => r.id === "no-eval");
    expect(noEval).toBeDefined();
    expect(noEval!.scope).toBe("always");
    expect(noEval!.priority).toBe(100);
    expect(noEval!.content).toBe("Never use eval()");
  });

  it("should include MCP config from MCP layer", async () => {
    const mcpData = new TextEncoder().encode(
      JSON.stringify({
        specVersion: "1.0.0",
        servers: {
          "test-server": {
            command: "npx",
            args: ["test-server"],
          },
        },
      }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.mcp, data: mcpData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.mcp).toBeDefined();
    expect(result.mcp!.servers).toBeDefined();
    expect(result.mcp!.servers["test-server"]).toBeDefined();
  });

  it("should include subagents from subagents layer", async () => {
    const subagentsData = new TextEncoder().encode(
      JSON.stringify({
        specVersion: "1.0.0",
        agents: {
          reviewer: {
            description: "Code reviewer",
            invocation: "delegate",
            instructions: "Review code",
            model: "claude-sonnet-4",
          },
          writer: {
            description: "Document writer",
            invocation: "manual",
            instructions: "Write docs",
          },
        },
      }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.subagents, data: subagentsData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.subagents).toBeDefined();
    expect(result.subagents!.length).toBe(2);

    const reviewer = result.subagents!.find((s) => s.name === "reviewer");
    expect(reviewer).toBeDefined();
    expect(reviewer!.description).toBe("Code reviewer");
    expect(reviewer!.invocation).toBe("delegate");
    expect(reviewer!.model).toBe("claude-sonnet-4");
  });

  it("should include secrets from secrets layer", async () => {
    const secretsData = new TextEncoder().encode(
      JSON.stringify([
        { key: "API_KEY", required: true, description: "API key" },
        { key: "DB_URL", required: false, kind: "connection-string" },
      ]),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.secrets, data: secretsData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.secrets).toBeDefined();
    expect(result.secrets!.length).toBe(2);
    expect(result.secrets![0]!.key).toBe("API_KEY");
    expect(result.secrets![0]!.required).toBe(true);
  });

  it("should include surfaces from surfaces layer", async () => {
    const surfaceFiles = new Map<string, Uint8Array>();
    surfaceFiles.set("instructions.md", new TextEncoder().encode("Main instructions content"));
    surfaceFiles.set("identity.md", new TextEncoder().encode("Identity content"));
    const surfacesBlob = createTarGz(surfaceFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.surfaces, data: surfacesBlob }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.surfaces).toBeDefined();
    expect(result.surfaces!.length).toBe(2);

    const instructions = result.surfaces!.find((s) => s.name === "instructions.md");
    expect(instructions).toBeDefined();
    expect(instructions!.content).toBe("Main instructions content");
  });

  it("should include knowledge files from knowledge layer", async () => {
    const knowledgeFiles = new Map<string, Uint8Array>();
    const docContent = new TextEncoder().encode("API documentation content");
    knowledgeFiles.set("docs/api.md", docContent);
    const knowledgeBlob = createTarGz(knowledgeFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.knowledge, data: knowledgeBlob }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.knowledge).toBeDefined();
    expect(result.knowledge!.length).toBe(1);
    expect(result.knowledge![0]!.path).toBe("docs/api.md");
    expect(new TextDecoder().decode(result.knowledge![0]!.content)).toBe(
      "API documentation content",
    );
  });

  it("should include instruction tree from instruction-tree layer", async () => {
    const treeFiles = new Map<string, Uint8Array>();
    treeFiles.set("_root.md", new TextEncoder().encode("Root instructions"));
    treeFiles.set("services/api.md", new TextEncoder().encode("API-specific instructions"));
    const treeBlob = createTarGz(treeFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.instructionTree, data: treeBlob }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.instructionTree).toBeDefined();
    expect(result.instructionTree!.length).toBe(2);

    const root = result.instructionTree!.find((n) => n.path === "_root");
    expect(root).toBeDefined();
    expect(root!.instructions).toBe("Root instructions");

    const api = result.instructionTree!.find((n) => n.path === "services/api");
    expect(api).toBeDefined();
    expect(api!.instructions).toBe("API-specific instructions");
  });

  // ── Package merge ──

  it("should merge package layers before agent layers", async () => {
    const packagesData = new TextEncoder().encode(JSON.stringify(["ghcr.io/test/pkg-a:1.0.0"]));

    const agentRulesFiles = new Map<string, Uint8Array>();
    agentRulesFiles.set(
      "agent-rule.md",
      new TextEncoder().encode(
        "---\nid: agent-rule\nscope: always\npriority: 100\n---\nAgent rule content",
      ),
    );
    const agentRulesBlob = createTarGz(agentRulesFiles);

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [
        { mediaType: LAYER_MEDIA_TYPES.packages, data: packagesData },
        { mediaType: LAYER_MEDIA_TYPES.rules, data: agentRulesBlob },
      ],
    });

    mockedResolvePackages.mockResolvedValue({
      packages: [{ reference: "ghcr.io/test/pkg-a:1.0.0", digest: "sha256:abc", dependencies: [] }],
      warnings: [],
    });

    const pkgRulesFiles = new Map<string, Uint8Array>();
    pkgRulesFiles.set(
      "pkg-rule.md",
      new TextEncoder().encode(
        "---\nid: pkg-rule\nscope: always\npriority: 50\n---\nPackage rule content",
      ),
    );
    const pkgRulesBlob = createTarGz(pkgRulesFiles);

    mockedPull.mockResolvedValue(
      makePkgPullResult(
        { specVersion: "1.0.0", name: "pkg-a", version: "1.0.0", description: "A package" },
        [{ mediaType: LAYER_MEDIA_TYPES.rules, data: pkgRulesBlob }],
      ),
    );

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.rules).toBeDefined();
    const agentRule = result.rules!.find((r) => r.id === "agent-rule");
    const pkgRule = result.rules!.find((r) => r.id === "pkg-rule");
    expect(agentRule).toBeDefined();
    expect(pkgRule).toBeDefined();
  });

  it("should apply higher-priority package wins on conflict", async () => {
    const packagesData = new TextEncoder().encode(
      JSON.stringify(["ghcr.io/test/pkg-a:1.0.0", "ghcr.io/test/pkg-b:1.0.0"]),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.packages, data: packagesData }],
    });

    mockedResolvePackages.mockResolvedValue({
      packages: [
        { reference: "ghcr.io/test/pkg-a:1.0.0", digest: "sha256:aaa", dependencies: [] },
        { reference: "ghcr.io/test/pkg-b:1.0.0", digest: "sha256:bbb", dependencies: [] },
      ],
      warnings: [],
    });

    const pkgARules = new Map<string, Uint8Array>();
    pkgARules.set(
      "shared.md",
      new TextEncoder().encode(
        "---\nid: shared-rule\nscope: always\npriority: 50\n---\nFrom package A",
      ),
    );
    const pkgARulesBlob = createTarGz(pkgARules);

    const pkgBRules = new Map<string, Uint8Array>();
    pkgBRules.set(
      "shared.md",
      new TextEncoder().encode(
        "---\nid: shared-rule\nscope: always\npriority: 90\n---\nFrom package B",
      ),
    );
    const pkgBRulesBlob = createTarGz(pkgBRules);

    mockedPull.mockImplementation(async (ref: string) => {
      if (ref.includes("pkg-a")) {
        return makePkgPullResult(
          { specVersion: "1.0.0", name: "pkg-a", version: "1.0.0", description: "A" },
          [{ mediaType: LAYER_MEDIA_TYPES.rules, data: pkgARulesBlob }],
        );
      }
      return makePkgPullResult(
        { specVersion: "1.0.0", name: "pkg-b", version: "1.0.0", description: "B" },
        [{ mediaType: LAYER_MEDIA_TYPES.rules, data: pkgBRulesBlob }],
      );
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    const sharedRule = result.rules!.find((r) => r.id === "shared-rule");
    expect(sharedRule).toBeDefined();
    expect(sharedRule!.content).toBe("From package B");
  });

  // ── Adapter compatibility ──

  it("should succeed with matching adapter type", async () => {
    const artifactDir = await createLocalArtifact(tmpDir, { config: baseConfig });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
      adapter: "claude-code",
    });

    expect(result.config.adapter.type).toBe("claude-code");
  });

  it("should use adapter override when provided", async () => {
    const artifactDir = await createLocalArtifact(tmpDir, { config: baseConfig });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
      adapter: "cursor",
    });

    expect(result.config.adapter.type).toBe("cursor");
  });

  it("should fail in exact mode when adapter cannot faithfully reproduce", async () => {
    const config = {
      ...baseConfig,
      adapter: {
        ...baseConfig.adapter,
        features: {
          ...baseConfig.adapter.features,
          exactMode: false,
        },
      },
    };
    const artifactDir = await createLocalArtifact(tmpDir, { config });

    await expect(
      materialize({
        source: artifactDir,
        outDir: join(tmpDir, "out"),
        adapter: "incompatible-adapter",
        exact: true,
      }),
    ).rejects.toThrow();
  });

  // ── Warnings ──

  it("should emit warnings for unsupported features", async () => {
    const config = {
      ...baseConfig,
      adapter: {
        ...baseConfig.adapter,
        features: {
          prompt: "native",
          persona: "unsupported",
          skills: "native",
        },
      },
    };

    const personaData = new TextEncoder().encode(
      JSON.stringify({ name: "test", displayName: "Test", role: "Tester" }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.persona, data: personaData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    const personaWarning = result.warnings.find((w) => w.layer === "persona");
    expect(personaWarning).toBeDefined();
  });

  it("should include MaterializationWarning objects with code, message, optional layer", async () => {
    const config = {
      ...baseConfig,
      adapter: {
        ...baseConfig.adapter,
        features: {
          prompt: "native",
          mcp: "unsupported",
        },
      },
    };

    const mcpData = new TextEncoder().encode(
      JSON.stringify({ specVersion: "1.0.0", servers: { s: { command: "x" } } }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.mcp, data: mcpData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    for (const warning of result.warnings) {
      expect(warning.code).toBeDefined();
      expect(typeof warning.code).toBe("string");
      expect(warning.message).toBeDefined();
      expect(typeof warning.message).toBe("string");
    }
  });

  // ── Prompt rendering ──

  it("should render {{persona.name}} in prompt", async () => {
    const promptData = new TextEncoder().encode("Hello, I am {{persona.name}}.");
    const personaData = new TextEncoder().encode(
      JSON.stringify({ name: "atlas", displayName: "Atlas", role: "AI Assistant" }),
    );

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [
        { mediaType: LAYER_MEDIA_TYPES.prompt, data: promptData },
        { mediaType: LAYER_MEDIA_TYPES.persona, data: personaData },
      ],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.prompt).toBe("Hello, I am atlas.");
  });

  it("should leave prompt unchanged when no persona", async () => {
    const promptData = new TextEncoder().encode("Hello, I am {{persona.name}}.");

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [{ mediaType: LAYER_MEDIA_TYPES.prompt, data: promptData }],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.prompt).toBe("Hello, I am {{persona.name}}.");
  });

  // ── Edge cases ──

  it("should handle agent with no optional layers", async () => {
    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.config).toBeDefined();
    expect(result.prompt).toBeUndefined();
    expect(result.persona).toBeUndefined();
    expect(result.skills).toBeUndefined();
    expect(result.rules).toBeUndefined();
    expect(result.mcp).toBeUndefined();
    expect(result.subagents).toBeUndefined();
    expect(result.secrets).toBeUndefined();
    expect(result.surfaces).toBeUndefined();
    expect(result.knowledge).toBeUndefined();
    expect(result.instructionTree).toBeUndefined();
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("should handle empty skills/rules directories", async () => {
    const emptyTar = new Uint8Array(1024);
    const emptyTarGz = new Uint8Array(gzipSync(Buffer.from(emptyTar)));

    const artifactDir = await createLocalArtifact(tmpDir, {
      config: baseConfig,
      layers: [
        { mediaType: LAYER_MEDIA_TYPES.skills, data: emptyTarGz },
        { mediaType: LAYER_MEDIA_TYPES.rules, data: emptyTarGz },
      ],
    });

    const result = await materialize({
      source: artifactDir,
      outDir: join(tmpDir, "out"),
    });

    expect(result.skills).toBeDefined();
    expect(result.skills!.length).toBe(0);
    expect(result.rules).toBeDefined();
    expect(result.rules!.length).toBe(0);
  });

  // ── OCI reference test ──

  it("should pull from OCI registry for non-local references", async () => {
    const configData = new TextEncoder().encode(JSON.stringify(baseConfig));
    const configHash = sha256(configData);
    const promptData = new TextEncoder().encode("Test prompt");
    const promptHash = sha256(promptData);

    const manifest: OciManifest = {
      schemaVersion: 2,
      mediaType: "application/vnd.oci.image.manifest.v1+json",
      artifactType: "application/vnd.stax.agent.v1",
      config: {
        mediaType: LAYER_MEDIA_TYPES.config,
        digest: `sha256:${configHash}`,
        size: configData.length,
      },
      layers: [
        {
          mediaType: LAYER_MEDIA_TYPES.prompt,
          digest: `sha256:${promptHash}`,
          size: promptData.length,
        },
      ],
    };

    const blobs = new Map<string, Uint8Array>();
    blobs.set(`sha256:${configHash}`, configData);
    blobs.set(`sha256:${promptHash}`, promptData);

    mockedPull.mockResolvedValue({ manifest, blobs });

    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: join(tmpDir, "out"),
    });

    expect(mockedPull).toHaveBeenCalledWith("ghcr.io/test/agent:1.0.0");
    expect(result.config.name).toBe("test-agent");
    expect(result.prompt).toBe("Test prompt");
  });
});
