import { describe, expect, it } from "vitest";
import { defineMcp } from "./mcp.ts";

describe("defineMcp", () => {
  it("should return MCP config with stdio server", () => {
    const config = defineMcp({
      servers: {
        "github-mcp": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "{{secrets.GITHUB_TOKEN}}" },
        },
      },
    });

    expect(config.servers["github-mcp"]).toBeDefined();
    expect((config.servers["github-mcp"] as any).command).toBe("npx");
  });

  it("should return MCP config with HTTP server", () => {
    const config = defineMcp({
      servers: {
        "remote-mcp": {
          url: "https://mcp.example.com/sse",
          transport: "sse",
          headers: { Authorization: "Bearer {{secrets.MCP_TOKEN}}" },
        },
      },
    });

    expect((config.servers["remote-mcp"] as any).url).toBe("https://mcp.example.com/sse");
  });

  it("should accept server with enabled tools filter", () => {
    const config = defineMcp({
      servers: {
        "filtered-mcp": {
          command: "npx",
          args: ["-y", "some-server"],
          enabledTools: ["read", "write"],
          disabledTools: ["delete"],
        },
      },
    });

    expect((config.servers["filtered-mcp"] as any).enabledTools).toEqual(["read", "write"]);
  });

  it("should accept server with registry reference", () => {
    const config = defineMcp({
      servers: {
        "registry-mcp": {
          command: "npx",
          registryRef: {
            registry: "ghcr.io",
            package: "myorg/mcp-server",
            version: "1.0.0",
          },
        },
      },
    });

    expect((config.servers["registry-mcp"] as any).registryRef!.package).toBe("myorg/mcp-server");
  });

  it("should reject empty servers", () => {
    expect(() => defineMcp({ servers: {} })).toThrow();
  });

  it("should accept multiple servers of different types", () => {
    const config = defineMcp({
      servers: {
        "stdio-server": { command: "npx", args: ["-y", "server"] },
        "http-server": { url: "https://api.example.com", transport: "http" },
        "sse-server": { url: "https://sse.example.com", transport: "sse" },
      },
    });
    expect(Object.keys(config.servers)).toHaveLength(3);
  });

  it("should accept server with enabled: false", () => {
    const config = defineMcp({
      servers: {
        "disabled-server": {
          command: "npx",
          enabled: false,
        },
      },
    });
    expect((config.servers["disabled-server"] as any).enabled).toBe(false);
  });

  it("should accept specVersion", () => {
    const config = defineMcp({
      specVersion: "1.0.0",
      servers: {
        test: { command: "npx" },
      },
    });
    expect(config.specVersion).toBe("1.0.0");
  });

  it("should accept server with connectTimeoutMs", () => {
    const config = defineMcp({
      servers: {
        "timeout-server": {
          command: "npx",
          connectTimeoutMs: 10000,
        },
      },
    });
    expect((config.servers["timeout-server"] as any).connectTimeoutMs).toBe(10000);
  });

  it("should accept server with metadata", () => {
    const config = defineMcp({
      servers: {
        "meta-server": {
          command: "npx",
          metadata: { provider: "anthropic", tier: "enterprise" },
        },
      },
    });
    expect((config.servers["meta-server"] as any).metadata!.provider).toBe("anthropic");
  });

  it("should accept server with secrets references", () => {
    const config = defineMcp({
      servers: {
        "secret-server": {
          command: "npx",
          secrets: ["API_KEY", "DB_PASSWORD"],
        },
      },
    });
    expect((config.servers["secret-server"] as any).secrets).toHaveLength(2);
  });

  it("should reject overlapping enabled and disabled tools", () => {
    expect(() =>
      defineMcp({
        servers: {
          "bad-server": {
            command: "npx",
            enabledTools: ["read", "write"],
            disabledTools: ["read"],
          },
        },
      }),
    ).toThrow();
  });

  it("should accept server with description", () => {
    const config = defineMcp({
      servers: {
        documented: {
          command: "npx",
          description: "A well-documented MCP server",
        },
      },
    });
    expect((config.servers["documented"] as any).description).toBe("A well-documented MCP server");
  });

  it("should accept HTTP server with headers", () => {
    const config = defineMcp({
      servers: {
        "authed-server": {
          url: "https://api.example.com",
          transport: "http",
          headers: { Authorization: "Bearer token", "X-Custom": "value" },
        },
      },
    });
    expect((config.servers["authed-server"] as any).headers!["Authorization"]).toBe("Bearer token");
  });

  it("should accept stdio server with cwd", () => {
    const config = defineMcp({
      servers: {
        "cwd-server": {
          command: "node",
          args: ["server.js"],
          cwd: "/path/to/workspace",
        },
      },
    });
    expect((config.servers["cwd-server"] as any).cwd).toBe("/path/to/workspace");
  });
});
