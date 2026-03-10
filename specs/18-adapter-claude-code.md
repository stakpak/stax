# 18 — Adapter: `@stax/claude-code`

## Overview

`@stax/claude-code` is the canonical stax adapter for Claude Code.

Its job is to materialize a canonical stax agent into the exact project-scoped or user-scoped files Claude Code expects, while making lossy transformations explicit.

This adapter targets the documented Claude Code file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

Claude Code supports multiple scopes.

| Scope | Typical files |
|------|---------------|
| User | `~/.claude/CLAUDE.md`, `~/.claude/skills/**`, `~/.claude/settings.json`, `~/.claude/agents/*.md`, `~/.claude.json` |
| Project | `CLAUDE.md` or `.claude/CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.mcp.json`, `.claude/agents/*.md` |
| Local override | `.claude/settings.local.json` |

In stax `1.0.0`, `@stax/claude-code` SHOULD default to **project scope** unless the user explicitly requests user scope.

The adapter MUST NOT generate `.claude/settings.local.json` unless explicitly asked, because it is local-only and should not be shared by default.

## Adapter interface

```typescript
interface ClaudeCodeAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: 'project' | 'user';
  exact?: boolean;

  instructionsFile?: 'CLAUDE.md' | '.claude/CLAUDE.md';
  writeSkills?: boolean;                // default: true
  writeMcp?: boolean;                   // default: true
  writeSettings?: boolean;              // default: true

  permissions?: {
    allowedTools?: string[];
    denyRules?: string[];
  };

  settings?: Record<string, unknown>;   // Claude-specific settings payload
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "claude-code",
  "runtime": "claude-code",
  "adapterVersion": "1.0.0"
}
```

`type: "claude"` MAY be accepted as a compatibility alias, but `claude-code` is preferred for new artifacts.

## Target mapping

### Project scope

| stax source | Target |
|------------|--------|
| `surfaces/instructions.md` or composed prompt | `CLAUDE.md` or `.claude/CLAUDE.md` |
| `skills/` | `.claude/skills/` |
| MCP layer | `.mcp.json` |
| adapter settings/config | `.claude/settings.json` |

### User scope

| stax source | Target |
|------------|--------|
| `surfaces/instructions.md` or composed prompt | `~/.claude/CLAUDE.md` |
| `skills/` | `~/.claude/skills/` |
| adapter settings/config | `~/.claude/settings.json` |
| MCP layer | `~/.claude.json` |

## `CLAUDE.md` generation

Claude Code has one main instruction document at a given scope.

If a consumer has an exact source document for that target, it SHOULD preserve bytes exactly.

### Exact source preference

The adapter SHOULD choose the first available source in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. synthesized composition

### Composed `CLAUDE.md` order

If composition is required, the adapter SHOULD render sections in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. `surfaces/persona.md` or a rendered persona summary
4. translated rules
5. `surfaces/tools.md`
6. `surfaces/identity.md`
7. `surfaces/user.md`
8. `surfaces/heartbeat.md`

In `exact` mode, if composition is required because no exact source document exists, the consumer MUST warn or fail according to policy.

## MCP mapping

Claude Code uses `.mcp.json` for project scope and `~/.claude.json` for user scope.

### Project output example

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "analytics": {
      "transport": "http",
      "url": "https://mcp.example.com/analytics"
    }
  }
}
```

### Mapping rules

- stdio servers map to `command`, `args`, and optional `env`
- remote servers map to `url` and transport-specific fields
- secret values MUST NOT be written directly; environment-variable references MAY be used where the runtime supports them
- unsupported canonical MCP fields MUST trigger warnings

## Settings mapping

The adapter SHOULD write Claude-specific configuration into `.claude/settings.json` or `~/.claude/settings.json`.

Example:

```json
{
  "model": "claude-opus-4-1",
  "permissions": {
    "allowedTools": ["Read", "Edit", "Bash", "Grep", "Write"],
    "denyRules": ["Bash(rm -rf *)"]
  }
}
```

The adapter MUST NOT write secret values into the settings file.

## Skills mapping

stax skills map directly to Claude Code skills:

- target directory: `.claude/skills/` or `~/.claude/skills/`
- each top-level skill directory MUST be preserved
- `SKILL.md` content SHOULD be preserved byte-for-byte

## Exactness requirements

An implementation claiming exact Claude Code support SHOULD:

1. support project and user scopes
2. write `.mcp.json` for project MCP config
3. write `.claude/settings.json` for settings
4. preserve skill directory structure exactly
5. avoid generating local-only files by default
6. warn or fail when synthesizing `CLAUDE.md`

## Files the adapter MUST NOT own by default

- `.claude/settings.local.json`
- auth tokens or credential files
- caches, logs, session state
- undocumented internal files
