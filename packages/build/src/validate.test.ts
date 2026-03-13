import { describe, it, expect, afterEach } from "vitest";
import { validate } from "./validate.ts";
import { mkdtemp, writeFile, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "stax-validate-test-"));
  tempDirs.push(dir);
  return dir;
}

function validAdapter(): string {
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

async function writeValidAgentTs(
  dir: string,
  overrides: Record<string, string> = {},
): Promise<string> {
  const agentPath = path.join(dir, "agent.ts");
  const fields: Record<string, string> = {
    name: '"my-agent"',
    version: '"1.0.0"',
    description: '"A test agent"',
    adapter: validAdapter(),
    ...overrides,
  };
  const entries = Object.entries(fields)
    .map(([k, v]) => `  ${k}: ${v},`)
    .join("\n");
  const content = `export default {\n${entries}\n};\n`;
  await writeFile(agentPath, content, "utf-8");
  return agentPath;
}

afterEach(async () => {
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  tempDirs.length = 0;
});

describe("validate", () => {
  describe("schema validation", () => {
    it("should return valid: true for a well-formed agent definition file", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir);
      const result = await validate({ entry });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should return valid: false when entry file does not exist", async () => {
      const result = await validate({ entry: "/nonexistent/agent.ts" });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("ENTRY_NOT_FOUND");
    });

    it("should return valid: false when entry has no default export", async () => {
      const dir = await createTempDir();
      const agentPath = path.join(dir, "agent.ts");
      await writeFile(agentPath, `export const name = "hello";\n`, "utf-8");
      const result = await validate({ entry: agentPath });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "NO_DEFAULT_EXPORT")).toBe(true);
    });

    it("should return valid: false when agent name is invalid", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { name: '"MyAgent"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_NAME")).toBe(true);
    });

    it("should return valid: false when version is not semver", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { version: '"abc"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_VERSION")).toBe(true);
    });

    it("should return valid: false when description is empty", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { description: '""' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "EMPTY_DESCRIPTION")).toBe(true);
    });

    it("should return valid: false when adapter is missing", async () => {
      const dir = await createTempDir();
      const agentPath = path.join(dir, "agent.ts");
      await writeFile(
        agentPath,
        `export default {\n  name: "my-agent",\n  version: "1.0.0",\n  description: "test",\n};\n`,
        "utf-8",
      );
      const result = await validate({ entry: agentPath });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_ADAPTER")).toBe(true);
    });

    it("should return valid: false when tags contain duplicates", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { tags: '["foo", "bar", "foo"]' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_TAGS")).toBe(true);
    });
  });

  describe("path reference validation", () => {
    it("should return valid: false when prompt path does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { prompt: '"prompt.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("prompt")),
      ).toBe(true);
    });

    it("should return valid: false when skills directory does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { skills: '"skills/"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("skills")),
      ).toBe(true);
    });

    it("should return valid: false when persona path does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { persona: '"persona.json"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("persona")),
      ).toBe(true);
    });

    it("should return valid: false when mcp path does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { mcp: '"mcp.json"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("mcp"))).toBe(
        true,
      );
    });

    it("should return valid: false when rules path does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { rules: '"rules/"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("rules"))).toBe(
        true,
      );
    });

    it("should return valid: false when knowledge path does not exist", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { knowledge: '"knowledge/"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "MISSING_PATH" && e.path.includes("knowledge")),
      ).toBe(true);
    });

    it("should return warning when optional memory path is missing", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, { memory: '"memory/"' });
      const result = await validate({ entry });
      // memory is optional, so it should be a warning not an error
      expect(
        result.warnings.some(
          (w) => w.code === "OPTIONAL_MISSING_PATH" && w.path.includes("memory"),
        ),
      ).toBe(true);
    });

    it("should return valid: true when referenced paths exist", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "prompt.md"), "# Hello", "utf-8");
      const entry = await writeValidAgentTs(dir, { prompt: '"prompt.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(true);
    });
  });

  describe("path type validation (spec 01: file vs directory)", () => {
    it("should return valid: false when prompt points to a directory instead of a file", async () => {
      const dir = await createTempDir();
      await mkdir(path.join(dir, "prompt-dir"));
      const entry = await writeValidAgentTs(dir, { prompt: '"prompt-dir"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when persona points to a directory instead of a file", async () => {
      const dir = await createTempDir();
      await mkdir(path.join(dir, "persona-dir"));
      const entry = await writeValidAgentTs(dir, { persona: '"persona-dir"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when mcp points to a directory instead of a file", async () => {
      const dir = await createTempDir();
      await mkdir(path.join(dir, "mcp-dir"));
      const entry = await writeValidAgentTs(dir, { mcp: '"mcp-dir"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when subagents points to a directory instead of a file", async () => {
      const dir = await createTempDir();
      await mkdir(path.join(dir, "subagents-dir"));
      const entry = await writeValidAgentTs(dir, { subagents: '"subagents-dir"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when skills points to a file instead of a directory", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "skills.md"), "# Skills", "utf-8");
      const entry = await writeValidAgentTs(dir, { skills: '"skills.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when rules points to a file instead of a directory", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "rules.md"), "# Rules", "utf-8");
      const entry = await writeValidAgentTs(dir, { rules: '"rules.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when knowledge points to a file instead of a directory", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "knowledge.md"), "# Knowledge", "utf-8");
      const entry = await writeValidAgentTs(dir, { knowledge: '"knowledge.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when surfaces points to a file instead of a directory", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "surfaces.json"), "{}", "utf-8");
      const entry = await writeValidAgentTs(dir, { surfaces: '"surfaces.json"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });

    it("should return valid: false when instructionTree points to a file instead of a directory", async () => {
      const dir = await createTempDir();
      await writeFile(path.join(dir, "instructions.md"), "# Instructions", "utf-8");
      const entry = await writeValidAgentTs(dir, { instructionTree: '"instructions.md"' });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "WRONG_PATH_TYPE")).toBe(true);
    });
  });

  describe("symlink validation", () => {
    it("should return valid: false when symlinks exist and symlinkMode is reject", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      const targetFile = path.join(dir, "external.md");
      await writeFile(targetFile, "external", "utf-8");
      await symlink(targetFile, path.join(skillsDir, "link.md"));
      const entry = await writeValidAgentTs(dir, { skills: '"skills"' });
      const result = await validate({ entry, symlinkMode: "reject" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "SYMLINK_FOUND")).toBe(true);
    });

    it("should return valid: true when symlinks exist and symlinkMode is flatten", async () => {
      const dir = await createTempDir();
      const skillsDir = path.join(dir, "skills");
      await mkdir(skillsDir);
      await writeFile(path.join(skillsDir, "real.md"), "content", "utf-8");
      const targetFile = path.join(dir, "external.md");
      await writeFile(targetFile, "external", "utf-8");
      await symlink(targetFile, path.join(skillsDir, "link.md"));
      const entry = await writeValidAgentTs(dir, { skills: '"skills"' });
      const result = await validate({ entry, symlinkMode: "flatten" });
      expect(result.valid).toBe(true);
    });
  });

  describe("package references", () => {
    it("should return valid: true for valid OCI package references", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, {
        packages: '["ghcr.io/stakpak/my-package:1.0.0", "docker.io/lib/tools:latest"]',
      });
      const result = await validate({ entry });
      expect(result.valid).toBe(true);
    });

    it("should return valid: false for malformed package references", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, {
        packages: '["", "   "]',
      });
      const result = await validate({ entry });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_PACKAGE_REF")).toBe(true);
    });
  });

  describe("multi-error accumulation", () => {
    it("should accumulate multiple errors", async () => {
      const dir = await createTempDir();
      const agentPath = path.join(dir, "agent.ts");
      await writeFile(
        agentPath,
        `export default {\n  name: "InvalidName",\n  version: "not-semver",\n  description: "",\n};\n`,
        "utf-8",
      );
      const result = await validate({ entry: agentPath });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("should include path, message, and code on every error and warning", async () => {
      const dir = await createTempDir();
      const entry = await writeValidAgentTs(dir, {
        name: '"InvalidName"',
        prompt: '"nonexistent.md"',
        memory: '"nonexistent-memory/"',
      });
      const result = await validate({ entry });
      for (const error of result.errors) {
        expect(typeof error.path).toBe("string");
        expect(typeof error.message).toBe("string");
        expect(typeof error.code).toBe("string");
        expect(error.path.length).toBeGreaterThan(0);
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.code.length).toBeGreaterThan(0);
      }
      for (const warning of result.warnings) {
        expect(typeof warning.path).toBe("string");
        expect(typeof warning.message).toBe("string");
        expect(typeof warning.code).toBe("string");
        expect(warning.path.length).toBeGreaterThan(0);
        expect(warning.message.length).toBeGreaterThan(0);
        expect(warning.code.length).toBeGreaterThan(0);
      }
    });
  });
});
