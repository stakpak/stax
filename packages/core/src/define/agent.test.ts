import { describe, expect, it } from "vitest";
import { defineAgent } from "./agent.ts";

const validAdapter = {
  type: "claude-code",
  runtime: "claude-code",
  adapterVersion: "1.0.0",
  config: {},
  features: {
    prompt: "native" as const,
    persona: "embedded" as const,
    rules: "native" as const,
    skills: "native" as const,
    mcp: "native" as const,
  },
};

describe("defineAgent", () => {
  it("should return the agent definition when valid", () => {
    const def = defineAgent({
      name: "backend-engineer",
      version: "3.1.0",
      description: "A backend engineer agent",
      adapter: validAdapter,
    });

    expect(def.name).toBe("backend-engineer");
    expect(def.version).toBe("3.1.0");
    expect(def.description).toBe("A backend engineer agent");
  });

  it("should default specVersion to 1.0.0", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
    });

    expect(def.specVersion).toBe("1.0.0");
  });

  it("should reject invalid name format", () => {
    expect(() =>
      defineAgent({
        name: "INVALID_NAME",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject names starting with a hyphen", () => {
    expect(() =>
      defineAgent({
        name: "-invalid",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject names ending with a hyphen", () => {
    expect(() =>
      defineAgent({
        name: "invalid-",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should accept valid kebab-case names", () => {
    const def = defineAgent({
      name: "my-cool-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
    });

    expect(def.name).toBe("my-cool-agent");
  });

  it("should reject invalid semver version", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "not-semver",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should accept all optional layer paths", () => {
    const def = defineAgent({
      name: "full-agent",
      version: "1.0.0",
      description: "Full agent",
      adapter: validAdapter,
      persona: "./persona.ts",
      prompt: "./SYSTEM_PROMPT.md",
      mcp: "./mcp.ts",
      skills: "./skills/",
      rules: "./rules/",
      knowledge: "./knowledge/",
      memory: "./memory/",
      surfaces: "./surfaces/",
      instructionTree: "./instruction-tree/",
      subagents: "./subagents.ts",
    });

    expect(def.persona).toBe("./persona.ts");
    expect(def.skills).toBe("./skills/");
  });

  it("should accept secrets declarations", () => {
    const def = defineAgent({
      name: "secret-agent",
      version: "1.0.0",
      description: "Agent with secrets",
      adapter: validAdapter,
      secrets: [
        { key: "ANTHROPIC_API_KEY", required: true, kind: "api-key" },
        { key: "GITHUB_TOKEN", required: false, kind: "token" },
      ],
    });

    expect(def.secrets).toHaveLength(2);
    expect(def.secrets![0]!.key).toBe("ANTHROPIC_API_KEY");
  });

  it("should accept runtime hints", () => {
    const def = defineAgent({
      name: "isolated-agent",
      version: "1.0.0",
      description: "Isolated agent",
      adapter: validAdapter,
      hints: {
        isolation: "microvm",
        capabilities: {
          shell: true,
          network: { mode: "restricted", allowlist: ["api.github.com"] },
        },
      },
    });

    expect(def.hints!.isolation).toBe("microvm");
  });

  it("should accept adapter fallback array", () => {
    const fallbackAdapter = { ...validAdapter, type: "codex", runtime: "codex" };
    const def = defineAgent({
      name: "fallback-agent",
      version: "1.0.0",
      description: "Agent with fallback",
      adapter: validAdapter,
      adapterFallback: [fallbackAdapter],
    });

    expect(def.adapterFallback).toHaveLength(1);
  });

  it("should accept package references", () => {
    const def = defineAgent({
      name: "packaged-agent",
      version: "1.0.0",
      description: "Agent with packages",
      adapter: validAdapter,
      packages: ["ghcr.io/myorg/packages/github-workflow:2.0.0", "./packages/local-overrides"],
    });

    expect(def.packages).toHaveLength(2);
  });

  it("should accept workspace source references", () => {
    const def = defineAgent({
      name: "ws-agent",
      version: "1.0.0",
      description: "Agent with workspace sources",
      adapter: validAdapter,
      workspaceSources: [
        {
          id: "backend-repo",
          ref: "ghcr.io/myorg/sources/backend:1.0.0",
          mountPath: "/workspace/backend",
          writable: false,
          required: true,
        },
      ],
    });

    expect(def.workspaceSources).toHaveLength(1);
  });

  it("should reject name longer than 63 characters", () => {
    expect(() =>
      defineAgent({
        name: "a".repeat(64),
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject missing required fields", () => {
    expect(() => defineAgent({} as any)).toThrow();
  });

  it("should reject names with spaces", () => {
    expect(() =>
      defineAgent({
        name: "my agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject names with dots", () => {
    expect(() =>
      defineAgent({
        name: "my.agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject names with underscores", () => {
    expect(() =>
      defineAgent({
        name: "my_agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should accept single character name", () => {
    const def = defineAgent({
      name: "a",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
    });
    expect(def.name).toBe("a");
  });

  it("should accept 63 character name", () => {
    const def = defineAgent({
      name: "a".repeat(63),
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
    });
    expect(def.name).toBe("a".repeat(63));
  });

  it("should reject empty name", () => {
    expect(() =>
      defineAgent({
        name: "",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject empty description", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should accept prerelease semver versions", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0-alpha.1",
      description: "Test",
      adapter: validAdapter,
    });
    expect(def.version).toBe("1.0.0-alpha.1");
  });

  it("should accept semver with build metadata", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0+build.123",
      description: "Test",
      adapter: validAdapter,
    });
    expect(def.version).toBe("1.0.0+build.123");
  });

  it("should reject version with only major", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "1",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should reject version with only major.minor", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "1.0",
        description: "Test",
        adapter: validAdapter,
      }),
    ).toThrow();
  });

  it("should accept tags as unique string array", () => {
    const def = defineAgent({
      name: "tagged-agent",
      version: "1.0.0",
      description: "Agent with tags",
      adapter: validAdapter,
      tags: ["backend", "golang", "microservices"],
    });
    expect(def.tags).toEqual(["backend", "golang", "microservices"]);
  });

  it("should reject duplicate tags", () => {
    expect(() =>
      defineAgent({
        name: "tagged-agent",
        version: "1.0.0",
        description: "Agent with tags",
        adapter: validAdapter,
        tags: ["backend", "backend"],
      }),
    ).toThrow();
  });

  it("should accept author field", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      author: "stakpak",
    });
    expect(def.author).toBe("stakpak");
  });

  it("should accept license field", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      license: "MIT",
    });
    expect(def.license).toBe("MIT");
  });

  it("should accept url field", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      url: "https://github.com/stakpak/stax",
    });
    expect(def.url).toBe("https://github.com/stakpak/stax");
  });

  it("should accept custom specVersion", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      specVersion: "1.0.0",
    });
    expect(def.specVersion).toBe("1.0.0");
  });

  it("should accept secrets with all kind values", () => {
    const kinds = [
      "api-key",
      "token",
      "password",
      "certificate",
      "connection-string",
      "url",
      "opaque",
    ] as const;
    for (const kind of kinds) {
      const def = defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
        secrets: [{ key: "SECRET", required: true, kind }],
      });
      expect(def.secrets![0]!.kind).toBe(kind);
    }
  });

  it("should accept secrets with exposeAs", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      secrets: [
        {
          key: "API_KEY",
          required: true,
          exposeAs: { env: "MY_API_KEY", file: "/run/secrets/key" },
        },
      ],
    });
    expect(def.secrets![0]!.exposeAs!.env).toBe("MY_API_KEY");
  });

  it("should accept all runtime hint isolation values", () => {
    const isolations = ["process", "container", "gvisor", "microvm"] as const;
    for (const isolation of isolations) {
      const def = defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
        hints: { isolation },
      });
      expect(def.hints!.isolation).toBe(isolation);
    }
  });

  it("should accept hints with filesystem capabilities", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      hints: {
        capabilities: {
          filesystem: {
            workspace: "/workspace",
            writable: ["/workspace/output"],
            denyRead: ["/etc/secrets"],
          },
        },
      },
    });
    expect(def.hints!.capabilities!.filesystem!.workspace).toBe("/workspace");
  });

  it("should accept hints with all network modes", () => {
    const modes = ["none", "restricted", "full"] as const;
    for (const mode of modes) {
      const def = defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
        hints: { capabilities: { network: { mode } } },
      });
      expect(def.hints!.capabilities!.network!.mode).toBe(mode);
    }
  });

  it("should accept workspace sources with all fields", () => {
    const def = defineAgent({
      name: "test-agent",
      version: "1.0.0",
      description: "Test",
      adapter: validAdapter,
      workspaceSources: [
        {
          id: "main-repo",
          ref: "ghcr.io/org/sources/main@sha256:abc123",
          mountPath: "/workspace/main",
          writable: true,
          required: true,
          subpath: "packages/core",
        },
      ],
    });
    expect(def.workspaceSources![0]!.subpath).toBe("packages/core");
  });

  it("should reject workspace sources with duplicate ids", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
        workspaceSources: [
          { id: "repo", ref: "ghcr.io/org/a:1.0.0", mountPath: "/a" },
          { id: "repo", ref: "ghcr.io/org/b:1.0.0", mountPath: "/b" },
        ],
      }),
    ).toThrow();
  });

  it("should reject workspace sources with colliding mountPaths", () => {
    expect(() =>
      defineAgent({
        name: "test-agent",
        version: "1.0.0",
        description: "Test",
        adapter: validAdapter,
        workspaceSources: [
          { id: "repo-a", ref: "ghcr.io/org/a:1.0.0", mountPath: "/workspace" },
          { id: "repo-b", ref: "ghcr.io/org/b:1.0.0", mountPath: "/workspace" },
        ],
      }),
    ).toThrow();
  });

  it("should accept multiple adapter fallbacks", () => {
    const def = defineAgent({
      name: "multi-adapter",
      version: "1.0.0",
      description: "Agent with multiple fallbacks",
      adapter: validAdapter,
      adapterFallback: [
        { ...validAdapter, type: "codex", runtime: "codex" },
        { ...validAdapter, type: "openclaw", runtime: "openclaw" },
        { ...validAdapter, type: "cursor", runtime: "cursor" },
      ],
    });
    expect(def.adapterFallback).toHaveLength(3);
  });
});
