# 06 — MCP

## Overview

MCP (Model Context Protocol) servers are how agents interact with external systems. stax defines a canonical, runtime-neutral MCP format.

The artifact describes **what servers exist and what they require**. Adapters and consumers decide how those servers are translated into runtime-native configuration.

## defineMcp()

```typescript
import { defineMcp } from 'stax';

export default defineMcp({
  servers: {
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      secrets: ['GITHUB_TOKEN'],
      description: 'GitHub API for repos, issues, and PRs',
      enabledTools: ['get_issue', 'create_pr'],
      cwd: '/workspace',
      env: {
        GITHUB_API_URL: 'https://api.github.com'
      },
    },
    analytics: {
      url: 'https://mcp.internal.company.com/analytics',
      transport: 'http',
      headers: {
        'x-team': 'platform'
      },
      secrets: ['ANALYTICS_TOKEN'],
      description: 'Internal analytics platform'
    }
  }
});
```

## Type definition

```typescript
interface McpConfig {
  specVersion?: '1.0.0';
  servers: Record<string, McpServer>;
}

type McpServer = McpStdioServer | McpHttpServer;

interface McpServerBase {
  description?: string;
  secrets?: string[];                  // Declared secret keys
  enabledTools?: string[];
  disabledTools?: string[];
  enabled?: boolean;                   // Default: true
  connectTimeoutMs?: number;           // Hint only
  metadata?: Record<string, string>;   // Informational only
}

interface McpStdioServer extends McpServerBase {
  command: string;
  args?: string[];
  env?: Record<string, string>;        // Static, non-secret env vars only
  cwd?: string;
}

interface McpHttpServer extends McpServerBase {
  url: string;
  transport: 'http' | 'sse';
  headers?: Record<string, string>;    // Static, non-secret headers only
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

## Secret references

MCP servers reference secrets by key name only.

```typescript
secrets: ['GITHUB_TOKEN']
```

The actual value is resolved by the consumer.

## Replace semantics in package merges

When packages are merged, MCP servers are merged by server name using **replace semantics**.

If a higher-precedence source defines `github`, it replaces the entire lower-precedence `github` object.

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

## Consumer translation expectations

Consumers translating MCP SHOULD:

1. validate that required secrets exist before launch
2. omit disabled servers by default
3. preserve server names
4. warn when a runtime cannot represent a field such as `headers`, `cwd`, or tool allow/deny lists

How MCP maps to Claude, Codex, Cursor, or other runtimes is defined in [12 — Adapters](./12-adapters.md) and [15 — Materialization](./15-materialization.md).
