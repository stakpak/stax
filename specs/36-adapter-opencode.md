# 36 — Adapter: `@stax/opencode`

## Overview

`@stax/opencode` is the canonical stax adapter for [OpenCode](https://github.com/anomalyco/opencode), the open-source terminal AI coding agent by Anomaly.

OpenCode uses `opencode.jsonc` (JSONC format) for configuration (including MCP servers, model settings, and agent definitions), `AGENTS.md` for project instructions, `.opencode/command/` for custom commands, `.opencode/skill/` for skills, and `.opencode/agent/` for agent definitions.

This adapter targets the documented OpenCode file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

| Scope      | Typical files                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project    | `opencode.jsonc`, `AGENTS.md`, `.opencode/command/*.md`, `.opencode/skill/**/SKILL.md`, `.opencode/agent/*.md`, `.opencode/plugin/*.ts`                    |
| User       | `~/.config/opencode/opencode.jsonc`, `~/.config/opencode/AGENTS.md`, `~/.opencode/command/*.md`, `~/.opencode/skill/**/SKILL.md`, `~/.opencode/agent/*.md` |
| Enterprise | `/Library/Application Support/opencode/` (macOS), `/etc/opencode/` (Linux), `C:\ProgramData\opencode\` (Windows)                                           |

In stax `1.0.0`, `@stax/opencode` SHOULD default to **project scope**.

## Adapter interface

```typescript
interface OpenCodeAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: "project" | "user";
  exact?: boolean;

  writeConfig?: boolean; // default: true
  writeInstructions?: boolean; // default: true
  writeMcp?: boolean; // default: true
  writeCommands?: boolean; // default: true
  writeSkills?: boolean; // default: true
  writeAgents?: boolean; // default: false

  agent?: {
    // OpenCode agent config
    build?: { model?: string };
    plan?: { model?: string };
    [name: string]:
      | { model?: string; description?: string; mode?: "primary" | "subagent" | "all" }
      | undefined;
  };

  permission?: {
    edit?: "allow" | "deny" | "ask";
    bash?: "allow" | "deny" | "ask";
    mcp?: "allow" | "deny" | "ask";
  };

  config?: Record<string, unknown>; // extra OpenCode JSONC config keys
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "opencode",
  "runtime": "opencode",
  "adapterVersion": "1.0.0"
}
```

## Exact target mapping

### Project scope

| stax source                                   | Target                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `AGENTS.md`                                                                   |
| `instructionTree`                             | configured `instructions` entries or scoped `AGENTS.md` files where supported |
| MCP layer                                     | `opencode.jsonc` under `mcp`                                                  |
| adapter config (model, agents)                | `opencode.jsonc`                                                              |
| skills                                        | `.opencode/skill/**/SKILL.md`                                                 |
| skills (as commands)                          | `.opencode/command/*.md`                                                      |
| `subagents`                                   | `.opencode/agent/*.md` when `writeAgents` is enabled                          |

### User scope

| stax source                                   | Target                                          |
| --------------------------------------------- | ----------------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `~/.config/opencode/AGENTS.md`                  |
| MCP layer                                     | `~/.config/opencode/opencode.jsonc` under `mcp` |
| adapter config                                | `~/.config/opencode/opencode.jsonc`             |
| skills                                        | `~/.opencode/skill/**/SKILL.md`                 |
| skills (as commands)                          | `~/.opencode/command/*.md`                      |

## Instruction files

OpenCode searches for instruction files by walking upward from the working directory to the worktree root:

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT.md` (deprecated)

The first match wins. At user scope, it reads `~/.config/opencode/AGENTS.md` and optionally `~/.claude/CLAUDE.md` for Claude Code compatibility.

Additional instruction file paths can be configured via the `instructions` array in config, which accepts file paths, globs, and HTTP URLs.

The adapter SHOULD write to `AGENTS.md` by default.

When an artifact includes [38 — Instruction Trees](./38-instruction-trees.md), the adapter MAY map scoped instruction documents to configured `instructions` entries or equivalent project-scoped files, warning when exact hierarchy preservation is not possible.

The adapter SHOULD choose the first available source in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. synthesized composition

In `exact` mode, if composition is required, the consumer MUST warn or fail according to policy.

## `opencode.jsonc` generation

OpenCode uses JSONC (JSON with Comments) for configuration. Config files are deep-merged across scopes, with project config overriding user config.

### Example output

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "agent": {
    "build": {
      "model": "anthropic/claude-sonnet-4-20250514",
    },
  },
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}",
      },
    },
    "analytics": {
      "type": "remote",
      "url": "https://mcp.example.com/analytics",
    },
  },
}
```

### Mapping rules

- `model` maps to top-level `model` (format: `provider/model-id`)
- agent-specific models map to `agent.<name>.model`
- canonical MCP servers map to `mcp` entries
- local (stdio) servers use `type: "local"`, `command` (string array), and optional `environment` (object)
- remote servers use `type: "remote"`, `url`, and optional `headers`
- secret values SHOULD use `{env:VARIABLE_NAME}` substitution syntax
- unsupported canonical fields MUST trigger warnings
- the adapter SHOULD include `"$schema": "https://opencode.ai/config.json"` in generated config

### Key format differences

- MCP key is `mcp` (not `mcpServers`)
- local servers use `command` as a string array (not separate `command` + `args`)
- environment variables use `environment` key (not `env`)
- the `{env:VAR}` substitution syntax is native to OpenCode JSONC parsing
- model identifiers use `provider/model` format (e.g., `anthropic/claude-sonnet-4-20250514`)

## Skills mapping

OpenCode natively supports skills with the same `SKILL.md` format as stax, including reading from `.claude/skills/` and `.agents/skills/` for compatibility.

stax skills map directly to `.opencode/skill/<name>/SKILL.md`:

- target directory: `.opencode/skill/` or `~/.opencode/skill/`
- each top-level skill directory MUST be preserved
- `SKILL.md` content SHOULD be preserved byte-for-byte
- supporting files SHOULD be preserved

## Commands mapping

OpenCode custom commands are `.md` files with YAML frontmatter stored in `.opencode/command/`.

stax skills MAY additionally be translated to `.opencode/command/<skill-name>.md`:

```markdown
---
description: "Deploy to production"
agent: build
subtask: true
---

Command content here with @file references.
```

### Frontmatter fields

| Field         | Type    | Purpose                         |
| ------------- | ------- | ------------------------------- |
| `description` | string  | Shown in command palette        |
| `agent`       | string  | Which agent handles the command |
| `model`       | string  | Model override                  |
| `subtask`     | boolean | Run as subtask                  |

Subdirectories create namespaced commands (e.g., `command/git/commit.md` → `/git/commit`).

## Agent definitions mapping

OpenCode supports file-based agent definitions in `.opencode/agent/*.md` with YAML frontmatter.

If `writeAgents` is enabled, the adapter MAY generate agent definition files:

```markdown
---
model: anthropic/claude-sonnet-4-20250514
description: "Backend engineer agent"
mode: primary
permission:
  edit: allow
  bash: ask
---

Agent-specific instructions here.
```

This is opt-in because agent definitions are a higher-level concept that may conflict with existing user-defined agents.

When a canonical subagents layer is present, the adapter SHOULD use it as the preferred source for generated agent definition files.

## Feature map

```json
{
  "prompt": "native",
  "persona": "embedded",
  "rules": "embedded",
  "skills": "native",
  "mcp": "translated",
  "surfaces": "embedded",
  "secrets": "consumer-only",
  "toolPermissions": "translated",
  "modelConfig": "native",
  "exactMode": true
}
```

## What the adapter MUST NOT own

- `.opencode/plans/` (runtime-generated plan state)
- `.opencode/node_modules/` (auto-installed plugin dependencies)
- `.opencode/package.json` (auto-generated for plugins)
- `.opencode/bun.lock` (auto-generated lockfile)
- `~/.local/state/opencode/` (runtime state, SQLite databases)
- `~/.local/share/opencode/` (binaries, logs)
- `~/.cache/opencode/` (cached data)
- OAuth tokens and auth state
- API keys in `provider` config
- `*.local.md` files (local instruction overrides)

## Exactness requirements

An implementation claiming exact OpenCode support SHOULD:

1. write valid JSONC to `opencode.jsonc`
2. translate MCP servers using `type: "local"` with `command` as string array and `environment` as object
3. use `{env:VAR}` syntax for secret references
4. write `AGENTS.md` when source instructions exist
5. preserve skill directory structure under `.opencode/skill/`
6. preserve command directory structure under `.opencode/command/`
7. materialize subagents to `.opencode/agent/*.md` when enabled and present
8. preserve instruction-tree fidelity or warn when only configured `instructions` entries are possible
9. avoid writing state files, API keys, or auto-generated plugin artifacts
10. warn or fail when lossy translations occur in `exact` mode
