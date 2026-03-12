import { describe, expect, it } from "vitest";
import { mcpSchema } from "./mcp.ts";

describe("mcpSchema", () => {
  it("should validate MCP config with stdio server", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "github-mcp": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should validate MCP config with HTTP server", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "remote-mcp": {
          url: "https://mcp.example.com/sse",
          transport: "sse",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should validate HTTP server with transport http", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "http-server": {
          url: "https://mcp.example.com/api",
          transport: "http",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should require servers field", () => {
    const result = mcpSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject empty servers object", () => {
    const result = mcpSchema.safeParse({ servers: {} });
    expect(result.success).toBe(false);
  });

  it("should accept server with env variables", () => {
    const result = mcpSchema.safeParse({
      servers: {
        github: {
          command: "npx",
          args: ["-y", "server"],
          env: { GITHUB_TOKEN: "{{secrets.GITHUB_TOKEN}}" },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with cwd", () => {
    const result = mcpSchema.safeParse({
      servers: {
        local: {
          command: "node",
          args: ["server.js"],
          cwd: "/path/to/workspace",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with headers for HTTP", () => {
    const result = mcpSchema.safeParse({
      servers: {
        remote: {
          url: "https://mcp.example.com/sse",
          transport: "sse",
          headers: { Authorization: "Bearer token" },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with enabled/disabled tools", () => {
    const result = mcpSchema.safeParse({
      servers: {
        filtered: {
          command: "npx",
          enabledTools: ["read", "write"],
          disabledTools: ["delete"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject overlapping enabledTools and disabledTools", () => {
    const result = mcpSchema.safeParse({
      servers: {
        bad: {
          command: "npx",
          enabledTools: ["read", "write"],
          disabledTools: ["read"],
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept server with enabled: false", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "disabled-server": {
          command: "npx",
          enabled: false,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with connectTimeoutMs", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "timeout-server": {
          command: "npx",
          connectTimeoutMs: 5000,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with secrets references", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "secret-server": {
          command: "npx",
          secrets: ["API_KEY", "DB_PASSWORD"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with metadata", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "meta-server": {
          command: "npx",
          metadata: { provider: "anthropic", tier: "enterprise" },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with registryRef", () => {
    const result = mcpSchema.safeParse({
      servers: {
        "registry-server": {
          command: "npx",
          registryRef: {
            registry: "ghcr.io",
            package: "myorg/mcp-server",
            version: "1.0.0",
            digest: "sha256:abc123",
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept multiple servers", () => {
    const result = mcpSchema.safeParse({
      servers: {
        github: { command: "npx", args: ["-y", "server-github"] },
        remote: { url: "https://example.com", transport: "http" },
        local: { command: "node", args: ["server.js"] },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept specVersion field", () => {
    const result = mcpSchema.safeParse({
      specVersion: "1.0.0",
      servers: {
        test: { command: "npx" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept server with description", () => {
    const result = mcpSchema.safeParse({
      servers: {
        documented: {
          command: "npx",
          description: "A well-documented MCP server",
        },
      },
    });
    expect(result.success).toBe(true);
  });
});
