# 18 — Adapter: `@stax/claude-code`

## Overview

`@stax/claude-code` is the canonical stax adapter for Claude Code.

Its job is to materialize a canonical stax agent into the exact project-scoped or user-scoped files Claude Code expects, while making lossy transformations explicit.

This adapter targets the documented Claude Code file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

Claude Code supports multiple scopes.

| Scope          | Typical files                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| User           | `~/.claude/CLAUDE.md`, `~/.claude/skills/**`, `~/.claude/settings.json`, `~/.claude/agents/*.md`, `~/.claude.json`   |
| Project        | `CLAUDE.md` or `.claude/CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.mcp.json`, `.claude/agents/*.md` |
| Local override | `.claude/settings.local.json`                                                                                        |

In stax `1.0.0`, `@stax/claude-code` SHOULD default to **project scope** unless the user explicitly requests user scope.

The adapter MUST NOT generate `.claude/settings.local.json` unless explicitly asked, because it is local-only and should not be shared by default.

## Adapter interface

```typescript
interface ClaudeCodeAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: "project" | "user";
  exact?: boolean;

  instructionsFile?: "CLAUDE.md" | ".claude/CLAUDE.md";
  writeSkills?: boolean; // default: true
  writeMcp?: boolean; // default: true
  writeSettings?: boolean; // default: true

  permissions?: {
    allowedTools?: string[];
    denyRules?: string[];
  };

  settings?: Record<string, unknown>; // Claude-specific settings payload
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

| stax source                                   | Target                             |
| --------------------------------------------- | ---------------------------------- |
| `surfaces/instructions.md` or composed prompt | `CLAUDE.md` or `.claude/CLAUDE.md` |
| `skills/`                                     | `.claude/skills/`                  |
| `subagents`                                   | `.claude/agents/*.md`              |
| MCP layer                                     | `.mcp.json`                        |
| adapter settings/config                       | `.claude/settings.json`            |

### User scope

| stax source                                   | Target                    |
| --------------------------------------------- | ------------------------- |
| `surfaces/instructions.md` or composed prompt | `~/.claude/CLAUDE.md`     |
| `skills/`                                     | `~/.claude/skills/`       |
| `subagents`                                   | `~/.claude/agents/*.md`   |
| adapter settings/config                       | `~/.claude/settings.json` |
| MCP layer                                     | `~/.claude.json`          |

## Persona mapping

Claude Code does not have a dedicated persona configuration surface. The persona is **embedded** into the primary instruction file (`CLAUDE.md`) during materialization.

When a persona layer is present, the adapter SHOULD:

1. render the persona's `displayName`, `role`, and `personality` into a preamble section at the top of `CLAUDE.md`
2. use the persona template if available, falling back to a default "You are {displayName}, {role}" format
3. warn in `exact` mode that persona metadata fields beyond the rendered text are lost

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

## Subagents mapping

When a subagents layer is present, the adapter SHOULD materialize each named subagent to:

- `.claude/agents/<name>.md` in project scope
- `~/.claude/agents/<name>.md` in user scope

Consumers SHOULD preserve the compiled instruction bytes and warn when Claude-specific metadata cannot represent a canonical subagent field exactly.

## Feature map

```json
{
  "prompt": "native",
  "persona": "embedded",
  "rules": "native",
  "skills": "native",
  "mcp": "native",
  "surfaces": "embedded",
  "secrets": "consumer-only",
  "subagents": "native",
  "instructionTree": "native",
  "toolPermissions": "native",
  "modelConfig": "native",
  "exactMode": true
}
```

## Exactness requirements

An implementation claiming exact Claude Code support SHOULD:

1. support project and user scopes
2. write `.mcp.json` for project MCP config
3. write `.claude/settings.json` for settings
4. preserve skill directory structure exactly
5. materialize subagents to `.claude/agents/*.md` when present
6. avoid generating local-only files by default
7. warn or fail when synthesizing `CLAUDE.md`

## Files the adapter MUST NOT own by default

- `.claude/settings.local.json`
- auth tokens or credential files
- caches, logs, session state
- undocumented internal files
