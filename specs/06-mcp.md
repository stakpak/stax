# 06 — MCP

## Overview

MCP (Model Context Protocol) servers are how agents interact with external systems. stax defines a canonical, runtime-neutral MCP format.

The artifact describes **what servers exist and what they require**. Adapters and consumers decide how those servers are translated into runtime-native configuration.

stax is intentionally complementary to the official MCP Registry. When an MCP server is sourced from a registry entry, stax SHOULD preserve that provenance so policy engines and catalogs can distinguish between inline MCP definitions and registry-backed ones.

## defineMcp()

```typescript
import { defineMcp } from "stax";

export default defineMcp({
  servers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      secrets: ["GITHUB_TOKEN"],
      description: "GitHub API for repos, issues, and PRs",
      enabledTools: ["get_issue", "create_pr"],
      cwd: "/workspace",
      env: {
        GITHUB_API_URL: "https://api.github.com",
      },
    },
    analytics: {
      url: "https://mcp.internal.company.com/analytics",
      transport: "http",
      headers: {
        "x-team": "platform",
      },
      secrets: ["ANALYTICS_TOKEN"],
      description: "Internal analytics platform",
    },
  },
});
```

## Type definition

```typescript
interface McpConfig {
  specVersion?: "1.0.0";
  servers: Record<string, McpServer>;
}

type McpServer = McpStdioServer | McpHttpServer;

interface McpServerBase {
  description?: string;
  secrets?: string[]; // Declared secret keys
  enabledTools?: string[];
  disabledTools?: string[];
  enabled?: boolean; // Default: true
  connectTimeoutMs?: number; // Hint only
  metadata?: Record<string, string>; // Informational only
  registryRef?: {
    registry?: string; // e.g. "official"
    package: string; // registry package or server identifier
    version?: string;
    digest?: string;
  };
}

interface McpStdioServer extends McpServerBase {
  command: string;
  args?: string[];
  env?: Record<string, string>; // Static, non-secret env vars only
  cwd?: string;
}

interface McpHttpServer extends McpServerBase {
  url: string;
  transport: "http" | "sse";
  headers?: Record<string, string>; // Static, non-secret headers only
}
```

## Validation

- Server names MUST be unique object keys
- A server MUST be exactly one of:
  - stdio (`command`)
  - remote (`url` + `transport`)
- `env` and `headers` MUST NOT contain secret values
- Every key listed in `secrets` MUST be declared in the merged secrets set of the consuming artifact
- `enabledTools` and `disabledTools` SHOULD NOT overlap; builders SHOULD fail on overlap
- if `registryRef.digest` is present, consumers SHOULD treat it as the strongest provenance identifier for policy and audit purposes

## Secret references

MCP servers reference secrets by key name only.

```typescript
secrets: ["GITHUB_TOKEN"];
```

The actual value is resolved by the consumer.

## Replace semantics in package merges

When packages are merged, MCP servers are merged by server name using **replace semantics**.

If a higher-precedence source defines `github`, it replaces the entire lower-precedence `github` object.

## Registry provenance

When an MCP server originates from an MCP registry record:

- builders SHOULD preserve a `registryRef`
- consumers SHOULD display registry provenance in inspect and install-plan output
- policy engines SHOULD be able to reason about registry origin independently from the resolved runtime config

stax does not replace MCP Registry discovery. It packages resolved MCP intent alongside optional registry provenance.

## Compiled JSON example

```json
{
  "specVersion": "1.0.0",
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "secrets": ["GITHUB_TOKEN"],
      "description": "GitHub API for repos, issues, and PRs",
      "enabled": true,
      "cwd": "/workspace"
    },
    "analytics": {
      "url": "https://mcp.internal.company.com/analytics",
      "transport": "http",
      "headers": {
        "x-team": "platform"
      },
      "secrets": ["ANALYTICS_TOKEN"],
      "description": "Internal analytics platform",
      "enabled": true
    }
  }
}
```

## Disabled servers

When `enabled: false`:

- Builders MUST still include the server in the packaged MCP layer (so consumers can re-enable it)
- Consumers MUST NOT start or configure disabled servers by default
- Consumers MAY expose a mechanism to override `enabled` at materialization time
- During package merging, `enabled` follows the same replace semantics as all other server fields — the highest-precedence definition wins

## Command resolution

For stdio servers, the `command` field specifies the executable name or path.

- Builders MUST NOT resolve or validate `command` at build time — resolution is a consumer responsibility
- Consumers MUST resolve `command` using the runtime environment's `PATH` (or equivalent) at materialization or launch time
- Consumers SHOULD warn if a `command` cannot be found in the current environment
- Consumers MUST NOT shell-expand or interpret `command` or `args` values — they are passed directly to process creation APIs (e.g., `execvp`, `child_process.spawn`)
- On Windows, consumers SHOULD handle `.cmd` / `.exe` extension resolution transparently when the bare command name is provided (e.g., `npx` → `npx.cmd`)
- Consumers SHOULD NOT assume a POSIX shell environment; `command` values that rely on shell features (pipes, redirects, subshells) are NOT portable and builders SHOULD warn if `command` contains shell metacharacters

## Consumer translation expectations

Consumers translating MCP MUST:

1. validate that required secrets exist before launch
2. omit disabled servers by default
3. preserve server names
4. warn when a runtime cannot represent a field such as `headers`, `cwd`, or tool allow/deny lists

How MCP maps to Claude, Codex, Cursor, or other runtimes is defined in [12 — Adapters](./12-adapters.md) and [15 — Materialization](./15-materialization.md).
