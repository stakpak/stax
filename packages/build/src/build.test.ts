import { describe, it, expect, afterEach } from "vitest";
import { build } from "./build.ts";
import { mkdtemp, writeFile, mkdir, symlink, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "stax-build-test-"));
  tempDirs.push(dir);
  return dir;
}

function validAdapterCode(): string {
  return `{
    type: "claude-code",
    runtime: "claude",
    adapterVersion: "1.0.0",
    config: {},
    features: {
      prompt: "native",
      persona: "native",
    },
  }`;
}

interface FixtureOptions {
  name?: string;
  version?: string;
  description?: string;
  prompt?: string;
  persona?: object;
  mcp?: object;
  skills?: Record<string, string>;
  rules?: Record<string, string>;
  knowledge?: Record<string, string>;
  memory?: Record<string, string>;
  surfaces?: Record<string, string>;
  instructionTree?: Record<string, string>;
  subagents?: object;
  secrets?: object[];
  packages?: string[];
  adapter?: object;
}

async function scaffoldFixture(opts: FixtureOptions = {}): Promise<{ dir: string; entry: string }> {
  const dir = await createTempDir();
  const agentFields: string[] = [];

  agentFields.push(`  name: "${opts.name ?? "test-agent"}",`);
  agentFields.push(`  version: "${opts.version ?? "1.0.0"}",`);
  agentFields.push(`  description: "${opts.description ?? "A test agent"}",`);

  if (opts.adapter) {
    agentFields.push(`  adapter: ${JSON.stringify(opts.adapter)},`);
  } else {
    agentFields.push(`  adapter: ${validAdapterCode()},`);
  }

  if (opts.prompt !== undefined) {
    await writeFile(path.join(dir, "prompt.md"), opts.prompt, "utf-8");
    agentFields.push(`  prompt: "prompt.md",`);
  }

  if (opts.persona !== undefined) {
    await writeFile(path.join(dir, "persona.json"), JSON.stringify(opts.persona), "utf-8");
    agentFields.push(`  persona: "persona.json",`);
  }

  if (opts.mcp !== undefined) {
    await writeFile(path.join(dir, "mcp.json"), JSON.stringify(opts.mcp), "utf-8");
    agentFields.push(`  mcp: "mcp.json",`);
  }

  if (opts.skills !== undefined) {
    const skillsDir = path.join(dir, "skills");
    await mkdir(skillsDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.skills)) {
      await writeFile(path.join(skillsDir, filename), content, "utf-8");
    }
    agentFields.push(`  skills: "skills",`);
  }

  if (opts.rules !== undefined) {
    const rulesDir = path.join(dir, "rules");
    await mkdir(rulesDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.rules)) {
      await writeFile(path.join(rulesDir, filename), content, "utf-8");
    }
    agentFields.push(`  rules: "rules",`);
  }

  if (opts.knowledge !== undefined) {
    const knowledgeDir = path.join(dir, "knowledge");
    await mkdir(knowledgeDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.knowledge)) {
      await writeFile(path.join(knowledgeDir, filename), content, "utf-8");
    }
    agentFields.push(`  knowledge: "knowledge",`);
  }

  if (opts.memory !== undefined) {
    const memoryDir = path.join(dir, "memory");
    await mkdir(memoryDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.memory)) {
      await writeFile(path.join(memoryDir, filename), content, "utf-8");
    }
    agentFields.push(`  memory: "memory",`);
  }

  if (opts.surfaces !== undefined) {
    const surfacesDir = path.join(dir, "surfaces");
    await mkdir(surfacesDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.surfaces)) {
      await writeFile(path.join(surfacesDir, filename), content, "utf-8");
    }
    agentFields.push(`  surfaces: "surfaces",`);
  }

  if (opts.instructionTree !== undefined) {
    const itDir = path.join(dir, "instruction-tree");
    await mkdir(itDir, { recursive: true });
    for (const [filename, content] of Object.entries(opts.instructionTree)) {
      await writeFile(path.join(itDir, filename), content, "utf-8");
    }
    agentFields.push(`  instructionTree: "instruction-tree",`);
  }

  if (opts.subagents !== undefined) {
    await writeFile(path.join(dir, "subagents.json"), JSON.stringify(opts.subagents), "utf-8");
    agentFields.push(`  subagents: "subagents.json",`);
  }

  if (opts.secrets !== undefined) {
    agentFields.push(`  secrets: ${JSON.stringify(opts.secrets)},`);
  }

  if (opts.packages !== undefined) {
    agentFields.push(`  packages: ${JSON.stringify(opts.packages)},`);
  }

  const agentContent = `export default {\n${agentFields.join("\n")}\n};\n`;
  const entry = path.join(dir, "agent.ts");
  await writeFile(entry, agentContent, "utf-8");

  return { dir, entry };
}

afterEach(async () => {
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  tempDirs.length = 0;
});

describe("build", () => {
  describe("minimal build", () => {
    it("should produce a BuildResult with a valid sha256 digest", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# Hello World" });
      const outDir = path.join(dir, "out");
      const result = await build({ entry, outDir });
      expect(result.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(result.layers.length).toBeGreaterThan(0);
    });

    it("should set artifactPath to outDir when provided", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# Hello" });
      const outDir = path.join(dir, "custom-out");
      const result = await build({ entry, outDir });
      expect(result.artifactPath).toBe(outDir);
    });

    it("should default artifactPath when outDir not provided", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# Hello" });
      const result = await build({ entry });
      expect(result.artifactPath).toBe(path.join(dir, ".stax", "artifacts"));
    });
  });

  describe("layer production", () => {
    it("should produce a prompt layer", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# My Prompt" });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const promptLayer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.prompt.v1+markdown",
      );
      expect(promptLayer).toBeDefined();
      expect(promptLayer!.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(promptLayer!.size).toBeGreaterThan(0);
    });

    it("should produce a persona layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        persona: { name: "expert", displayName: "Expert", role: "Senior Dev" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.persona.v1+json",
      );
      expect(layer).toBeDefined();
    });

    it("should produce an MCP layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        mcp: { specVersion: "1.0", servers: { test: { command: "echo", args: ["hello"] } } },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find((l) => l.mediaType === "application/vnd.stax.mcp.v1+json");
      expect(layer).toBeDefined();
    });

    it("should produce a skills layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        skills: { "deploy.md": "# Deploy skill" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.skills.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a rules layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        rules: { "lint.md": "# Lint rule" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.rules.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a knowledge layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        knowledge: { "docs.md": "# Docs" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.knowledge.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a surfaces layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        surfaces: { "web.json": '{"instructions":"hello"}' },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.surfaces.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a subagents layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        subagents: {
          specVersion: "1.0",
          agents: { helper: { description: "Helper", instructions: "Help the user" } },
        },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.subagents.v1+json",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a secrets layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        secrets: [{ key: "API_KEY", required: true, description: "The API key" }],
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.secrets.v1+json",
      );
      expect(layer).toBeDefined();
    });

    it("should produce an instruction-tree layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        instructionTree: { "root.md": "# Root instructions" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.instruction-tree.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });

    it("should produce a memory layer", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        memory: { "session.json": '{"data":"value"}' },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.memory.v1.tar+gzip",
      );
      expect(layer).toBeDefined();
    });
  });

  describe("layer ordering", () => {
    it("should order layers according to LAYER_ORDER", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        persona: { name: "expert", displayName: "Expert", role: "Dev" },
        mcp: { specVersion: "1.0", servers: { s: { command: "echo" } } },
        skills: { "a.md": "skill" },
        rules: { "a.md": "rule" },
        knowledge: { "a.md": "knowledge" },
        memory: { "a.json": "{}" },
        surfaces: { "a.json": "{}" },
        subagents: {
          specVersion: "1.0",
          agents: { a: { description: "A", instructions: "Do A" } },
        },
        secrets: [{ key: "K", required: true }],
        instructionTree: { "root.md": "# Root" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });

      const expectedOrder = [
        "application/vnd.stax.knowledge.v1.tar+gzip",
        "application/vnd.stax.rules.v1.tar+gzip",
        "application/vnd.stax.skills.v1.tar+gzip",
        "application/vnd.stax.mcp.v1+json",
        "application/vnd.stax.secrets.v1+json",
        "application/vnd.stax.instruction-tree.v1.tar+gzip",
        "application/vnd.stax.surfaces.v1.tar+gzip",
        "application/vnd.stax.prompt.v1+markdown",
        "application/vnd.stax.persona.v1+json",
        "application/vnd.stax.subagents.v1+json",
        "application/vnd.stax.memory.v1.tar+gzip",
      ];

      const mediaTypes = result.layers.map((l) => l.mediaType);
      // Filter expected to only those present
      const presentExpected = expectedOrder.filter((mt) => mediaTypes.includes(mt));
      const presentActual = mediaTypes.filter((mt) => expectedOrder.includes(mt));
      expect(presentActual).toEqual(presentExpected);
    });
  });

  describe("determinism", () => {
    it("should produce identical digests for identical inputs", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# Deterministic" });
      const outDir1 = path.join(dir, "out1");
      const outDir2 = path.join(dir, "out2");
      const result1 = await build({ entry, outDir: outDir1 });
      const result2 = await build({ entry, outDir: outDir2 });
      expect(result1.digest).toBe(result2.digest);
      expect(result1.layers.map((l) => l.digest)).toEqual(result2.layers.map((l) => l.digest));
    });

    it("should produce different digests for different inputs", async () => {
      const f1 = await scaffoldFixture({ prompt: "# Version A" });
      const f2 = await scaffoldFixture({ prompt: "# Version B" });
      const r1 = await build({ entry: f1.entry, outDir: path.join(f1.dir, "out") });
      const r2 = await build({ entry: f2.entry, outDir: path.join(f2.dir, "out") });
      expect(r1.digest).not.toBe(r2.digest);
    });

    it("should produce identical tar+gzip layers regardless of file creation order", async () => {
      // Fixture 1: create a.md then b.md
      const dir1 = await createTempDir();
      const skills1 = path.join(dir1, "skills");
      await mkdir(skills1);
      await writeFile(path.join(skills1, "a.md"), "alpha", "utf-8");
      await writeFile(path.join(skills1, "b.md"), "beta", "utf-8");
      await writeFile(path.join(dir1, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir1, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );

      // Fixture 2: create b.md then a.md
      const dir2 = await createTempDir();
      const skills2 = path.join(dir2, "skills");
      await mkdir(skills2);
      await writeFile(path.join(skills2, "b.md"), "beta", "utf-8");
      await writeFile(path.join(skills2, "a.md"), "alpha", "utf-8");
      await writeFile(path.join(dir2, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir2, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );

      const r1 = await build({
        entry: path.join(dir1, "agent.ts"),
        outDir: path.join(dir1, "out"),
      });
      const r2 = await build({
        entry: path.join(dir2, "agent.ts"),
        outDir: path.join(dir2, "out"),
      });

      const skillsLayer1 = r1.layers.find((l) => l.mediaType.includes("skills"));
      const skillsLayer2 = r2.layers.find((l) => l.mediaType.includes("skills"));
      expect(skillsLayer1!.digest).toBe(skillsLayer2!.digest);
    });
  });

  describe("JSON layer determinism", () => {
    it("should produce persona layer using canonical JSON", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        persona: { role: "Dev", name: "expert", displayName: "Expert" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.persona.v1+json",
      )!;
      // Read the blob and verify keys are sorted
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = await readFile(blobPath, "utf-8");
      const parsed = JSON.parse(content);
      const keys = Object.keys(parsed);
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    it("should produce MCP layer using canonical JSON", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        mcp: { servers: { zebra: { command: "z" }, alpha: { command: "a" } }, specVersion: "1.0" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find((l) => l.mediaType === "application/vnd.stax.mcp.v1+json")!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = await readFile(blobPath, "utf-8");
      // Canonical JSON has sorted keys, no whitespace
      expect(content).not.toContain("\n");
      expect(content).not.toContain("  ");
    });

    it("should produce subagents layer using canonical JSON", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        subagents: {
          agents: {
            beta: { description: "B", instructions: "B" },
            alpha: { description: "A", instructions: "A" },
          },
          specVersion: "1.0",
        },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.subagents.v1+json",
      )!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = await readFile(blobPath, "utf-8");
      expect(content).not.toContain("\n");
    });

    it("should produce secrets layer using canonical JSON", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        secrets: [
          { required: true, key: "Z_KEY", description: "z" },
          { key: "A_KEY", required: false },
        ],
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.secrets.v1+json",
      )!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = await readFile(blobPath, "utf-8");
      expect(content).not.toContain("\n");
    });
  });

  describe("markdown layer", () => {
    it("should produce prompt layer as UTF-8 encoded markdown", async () => {
      const promptContent = "# Hello World\n\nThis is a **test** prompt.\n";
      const { entry, dir } = await scaffoldFixture({ prompt: promptContent });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.prompt.v1+markdown",
      )!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = await readFile(blobPath, "utf-8");
      expect(content).toBe(promptContent);
    });
  });

  describe("tar+gzip layers", () => {
    it("should produce skills layer with files sorted lexicographically", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        skills: { "c.md": "c", "a.md": "a", "b.md": "b" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      // Extract filenames from tar headers (first 100 bytes of each 512-byte header)
      const filenames: string[] = [];
      let offset = 0;
      while (offset < tarData.length) {
        const header = tarData.subarray(offset, offset + 512);
        // Check if this is a null block (end of archive)
        if (header.every((b) => b === 0)) break;
        const nameEnd = header.indexOf(0);
        const name = new TextDecoder().decode(header.subarray(0, nameEnd > 0 ? nameEnd : 100));
        if (name.length > 0) filenames.push(name);
        // Read file size from octal at offset 124, length 12
        const sizeStr = new TextDecoder()
          .decode(header.subarray(124, 135))
          .replaceAll("\0", "")
          .trim();
        const size = parseInt(sizeStr, 8) || 0;
        const blocks = Math.ceil(size / 512);
        offset += 512 + blocks * 512;
      }
      expect(filenames).toEqual(["a.md", "b.md", "c.md"]);
    });

    it("should produce rules layer with mtime=0, uid/gid=0", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        rules: { "rule.md": "# Rule" },
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find((l) => l.mediaType.includes("rules"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      // Check mtime at offset 136-147 (octal, should be 0)
      const mtimeStr = new TextDecoder()
        .decode(tarData.subarray(136, 147))
        .replaceAll("\0", "")
        .trim();
      expect(parseInt(mtimeStr, 8)).toBe(0);
      // Check uid at offset 108-115
      const uidStr = new TextDecoder()
        .decode(tarData.subarray(108, 115))
        .replaceAll("\0", "")
        .trim();
      expect(parseInt(uidStr, 8)).toBe(0);
      // Check gid at offset 116-123
      const gidStr = new TextDecoder()
        .decode(tarData.subarray(116, 123))
        .replaceAll("\0", "")
        .trim();
      expect(parseInt(gidStr, 8)).toBe(0);
    });

    it("should reject symlinks in layer source directories by default", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      const targetFile = path.join(dir, "external.md");
      await writeFile(targetFile, "external", "utf-8");
      await symlink(targetFile, path.join(skillsDir, "link.md"));
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      await expect(
        build({ entry: path.join(dir, "agent.ts"), outDir: path.join(dir, "out") }),
      ).rejects.toThrow(/symlink/i);
    });

    it("should flatten symlinks when symlinkMode is flatten", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      const targetFile = path.join(dir, "external.md");
      await writeFile(targetFile, "external content", "utf-8");
      await symlink(targetFile, path.join(skillsDir, "link.md"));
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
        symlinkMode: "flatten",
      });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"));
      expect(layer).toBeDefined();
    });
  });

  describe("ignore rules", () => {
    it("should ignore .git/ directories in layer source paths", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      await mkdir(path.join(skillsDir, ".git"), { recursive: true });
      await writeFile(path.join(skillsDir, ".git", "config"), "git stuff", "utf-8");
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
      });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      const content = new TextDecoder().decode(tarData);
      expect(content).not.toContain(".git");
    });

    it("should ignore .stax/ directories", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      await mkdir(path.join(skillsDir, ".stax"), { recursive: true });
      await writeFile(path.join(skillsDir, ".stax", "cache"), "cache", "utf-8");
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
      });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      const content = new TextDecoder().decode(tarData);
      expect(content).not.toContain(".stax");
    });

    it("should respect .staxignore patterns", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "keep.md"), "keep", "utf-8");
      await writeFile(path.join(skillsDir, "ignore-me.tmp"), "ignore", "utf-8");
      await writeFile(path.join(dir, ".staxignore"), "*.tmp\n", "utf-8");
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
      });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      // Extract filenames
      const filenames: string[] = [];
      let offset = 0;
      while (offset < tarData.length) {
        const header = tarData.subarray(offset, offset + 512);
        if (header.every((b) => b === 0)) break;
        const nameEnd = header.indexOf(0);
        const name = new TextDecoder().decode(header.subarray(0, nameEnd > 0 ? nameEnd : 100));
        if (name.length > 0) filenames.push(name);
        const sizeStr = new TextDecoder()
          .decode(header.subarray(124, 135))
          .replaceAll("\0", "")
          .trim();
        const size = parseInt(sizeStr, 8) || 0;
        const blocks = Math.ceil(size / 512);
        offset += 512 + blocks * 512;
      }
      expect(filenames).toContain("keep.md");
      expect(filenames).not.toContain("ignore-me.tmp");
    });

    it("should ignore the output directory", async () => {
      const dir = await createTempDir();
      // skills dir is the project root itself, and outDir is inside it
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      // put a fake outDir inside skills to test it's ignored
      const outDirInside = path.join(skillsDir, ".stax");
      await mkdir(outDirInside, { recursive: true });
      await writeFile(path.join(outDirInside, "artifact.json"), "{}", "utf-8");
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", skills: "skills" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
      });
      const layer = result.layers.find((l) => l.mediaType.includes("skills"))!;
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const gzData = await readFile(blobPath);
      const tarData = gunzipSync(gzData);
      const content = new TextDecoder().decode(tarData);
      expect(content).not.toContain("artifact.json");
    });
  });

  describe("config blob", () => {
    it("should produce a config blob with specVersion, name, version, description, adapter", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# P" });
      await build({ entry, outDir: path.join(dir, "out") });
      // The config blob is written - check the manifest
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      expect(manifest.config).toBeDefined();
      expect(manifest.config.mediaType).toBe("application/vnd.stax.config.v1+json");
      // Read the config blob
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.name).toBe("test-agent");
      expect(configContent.version).toBe("1.0.0");
      expect(configContent.description).toBe("A test agent");
      expect(configContent.adapter).toBeDefined();
      expect(configContent.adapter.type).toBe("claude-code");
    });

    it("should include kind: agent in config blob (spec 01/02)", async () => {
      const { entry, dir } = await scaffoldFixture({ prompt: "# P" });
      await build({ entry, outDir: path.join(dir, "out") });
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.kind).toBe("agent");
    });

    it("should include full adapter config with features, config, model in config blob", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        adapter: {
          type: "claude-code",
          runtime: "claude-code",
          adapterVersion: "1.0.0",
          model: "claude-opus-4-1",
          modelParams: { temperature: 0.5 },
          importMode: "filesystem",
          fidelity: "best-effort",
          config: { scope: "project" },
          features: { prompt: "native", persona: "embedded" },
          targets: [{ kind: "file", path: "CLAUDE.md", scope: "project" }],
        },
      });
      await build({ entry, outDir: path.join(dir, "out") });
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.adapter.config).toEqual({ scope: "project" });
      expect(configContent.adapter.features).toEqual({ prompt: "native", persona: "embedded" });
      expect(configContent.adapter.model).toBe("claude-opus-4-1");
      expect(configContent.adapter.modelParams).toEqual({ temperature: 0.5 });
      expect(configContent.adapter.importMode).toBe("filesystem");
      expect(configContent.adapter.fidelity).toBe("best-effort");
      expect(configContent.adapter.targets).toEqual([
        { kind: "file", path: "CLAUDE.md", scope: "project" },
      ]);
    });

    it("should include author, license, url, tags in config blob when declared", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default {
  name: "test-agent",
  version: "1.0.0",
  description: "A test agent",
  author: "stakpak",
  license: "MIT",
  url: "https://example.com",
  tags: ["test", "demo"],
  adapter: ${validAdapterCode()},
  prompt: "prompt.md",
};\n`,
        "utf-8",
      );
      await build({ entry: path.join(dir, "agent.ts"), outDir: path.join(dir, "out") });
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.author).toBe("stakpak");
      expect(configContent.license).toBe("MIT");
      expect(configContent.url).toBe("https://example.com");
      expect(configContent.tags).toEqual(["test", "demo"]);
    });

    it("should include adapterFallback in config blob when declared (spec 01)", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default {
  name: "test-agent",
  version: "1.0.0",
  description: "A test agent",
  adapter: ${validAdapterCode()},
  adapterFallback: [
    { type: "generic", runtime: "generic", adapterVersion: "1.0.0", config: {}, features: {} },
  ],
  prompt: "prompt.md",
};\n`,
        "utf-8",
      );
      await build({ entry: path.join(dir, "agent.ts"), outDir: path.join(dir, "out") });
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.adapterFallback).toBeDefined();
      expect(configContent.adapterFallback).toHaveLength(1);
      expect(configContent.adapterFallback[0].type).toBe("generic");
    });

    it("should include hints and workspaceSources in config blob when declared", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default {
  name: "test-agent",
  version: "1.0.0",
  description: "A test agent",
  adapter: ${validAdapterCode()},
  prompt: "prompt.md",
  hints: { isolation: "container", capabilities: { shell: true } },
  workspaceSources: [{ id: "src", ref: "ghcr.io/org/src:1.0", mountPath: "./src", required: true }],
};\n`,
        "utf-8",
      );
      await build({ entry: path.join(dir, "agent.ts"), outDir: path.join(dir, "out") });
      const manifestPath = path.join(dir, "out", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      const configDigest = manifest.config.digest.replace("sha256:", "");
      const configBlobPath = path.join(dir, "out", "blobs", "sha256", configDigest);
      const configContent = JSON.parse(await readFile(configBlobPath, "utf-8"));
      expect(configContent.hints).toEqual({
        isolation: "container",
        capabilities: { shell: true },
      });
      expect(configContent.workspaceSources).toEqual([
        { id: "src", ref: "ghcr.io/org/src:1.0", mountPath: "./src", required: true },
      ]);
    });
  });

  describe("packages layer format", () => {
    it("should produce packages layer as structured object with specVersion (spec 03)", async () => {
      const { entry, dir } = await scaffoldFixture({
        prompt: "# P",
        packages: ["ghcr.io/myorg/pkg:1.0.0"],
      });
      const result = await build({ entry, outDir: path.join(dir, "out") });
      const layer = result.layers.find(
        (l) => l.mediaType === "application/vnd.stax.packages.v1+json",
      )!;
      expect(layer).toBeDefined();
      const blobPath = path.join(
        dir,
        "out",
        "blobs",
        "sha256",
        layer.digest.replace("sha256:", ""),
      );
      const content = JSON.parse(await readFile(blobPath, "utf-8"));
      expect(content.specVersion).toBe("1.0.0");
      expect(Array.isArray(content.packages)).toBe(true);
      expect(content.packages[0]).toEqual(
        expect.objectContaining({ ref: "ghcr.io/myorg/pkg:1.0.0" }),
      );
    });
  });

  describe("error handling", () => {
    it("should throw when entry file is invalid", async () => {
      await expect(build({ entry: "/nonexistent/agent.ts", outDir: "/tmp/out" })).rejects.toThrow();
    });

    it("should include warnings for empty optional directories", async () => {
      const dir = await createTempDir();
      const memoryDir = path.join(dir, "memory");
      await mkdir(memoryDir);
      // Empty directory
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "prompt.md", memory: "memory" };\n`,
        "utf-8",
      );
      const result = await build({
        entry: path.join(dir, "agent.ts"),
        outDir: path.join(dir, "out"),
      });
      expect(result.warnings.some((w) => w.includes("empty"))).toBe(true);
    });

    it("should throw when paths reference outside project root and allowOutsideRoot is false", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "prompt.md"), "# P", "utf-8");
      await writeFile(
        path.join(dir, "agent.ts"),
        `export default { name: "test-agent", version: "1.0.0", description: "test", adapter: ${validAdapterCode()}, prompt: "../../../etc/passwd" };\n`,
        "utf-8",
      );
      await expect(
        build({
          entry: path.join(dir, "agent.ts"),
          outDir: path.join(dir, "out"),
          allowOutsideRoot: false,
        }),
      ).rejects.toThrow(/outside.*root/i);
    });
  });
});
