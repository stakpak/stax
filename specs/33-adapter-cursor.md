# 33 — Adapter: `@stax/cursor`

## Overview

`@stax/cursor` is the canonical stax adapter for Cursor IDE.

Cursor is a VS Code fork with AI-native features. Its agent configuration uses `.cursor/rules/` for rules, `.cursor/mcp.json` for MCP servers, `.cursor/skills/` for skills, and supports `AGENTS.md` for instructions.

This adapter targets the documented Cursor file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

| Scope   | Typical files                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------- |
| Project | `.cursor/rules/*.mdc`, `.cursor/mcp.json`, `.cursor/skills/**`, `.cursor/hooks.json`, `AGENTS.md` |
| User    | `~/.cursor/rules/*.mdc`, `~/.cursor/mcp.json`, `~/.cursor/skills/**`, `~/.cursor/hooks.json`      |
| Legacy  | `.cursorrules` (project root, deprecated in favor of `.cursor/rules/`)                            |

In stax `1.0.0`, `@stax/cursor` SHOULD default to **project scope**.

## Adapter interface

```typescript
interface CursorAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: "project" | "user";
  exact?: boolean;

  writeRules?: boolean; // default: true
  writeMcp?: boolean; // default: true
  writeSkills?: boolean; // default: true
  writeInstructions?: boolean; // default: true

  legacyCursorrules?: boolean; // default: false — emit .cursorrules instead of .cursor/rules/

  config?: Record<string, unknown>; // Cursor-specific settings
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "cursor",
  "runtime": "cursor",
  "adapterVersion": "1.0.0"
}
```

## Exact target mapping

### Project scope

| stax source                                   | Target                |
| --------------------------------------------- | --------------------- |
| `surfaces/instructions.md` or composed prompt | `AGENTS.md`           |
| rules                                         | `.cursor/rules/*.mdc` |
| MCP layer                                     | `.cursor/mcp.json`    |
| skills                                        | `.cursor/skills/`     |

### User scope

| stax source                                   | Target                                  |
| --------------------------------------------- | --------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `~/.cursor/rules/stax-instructions.mdc` |
| rules                                         | `~/.cursor/rules/*.mdc`                 |
| MCP layer                                     | `~/.cursor/mcp.json`                    |
| skills                                        | `~/.cursor/skills/`                     |

## `AGENTS.md` generation

Cursor supports `AGENTS.md` at the project root and subdirectories as always-on instruction files.

The adapter SHOULD choose the first available source in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. synthesized composition

In `exact` mode, if composition is required because no exact source document exists, the consumer MUST warn or fail according to policy.

## Persona mapping

Cursor does not have a dedicated persona configuration surface. The persona is **embedded** into the primary instruction file (`AGENTS.md`) during materialization.

When a persona layer is present, the adapter SHOULD:

1. render the persona's `displayName`, `role`, and `personality` into a preamble section at the top of `AGENTS.md`
2. use the persona template if available, falling back to a default "You are {displayName}, {role}" format
3. warn in `exact` mode that persona metadata fields beyond the rendered text are lost

## Rules mapping

Cursor uses `.mdc` or `.md` files in `.cursor/rules/` with YAML frontmatter.

### Rule translation

Each canonical stax rule SHOULD be translated to a `.cursor/rules/<rule-id>.mdc` file with the following frontmatter mapping:

| stax rule field   | Cursor frontmatter field                           |
| ----------------- | -------------------------------------------------- |
| `scope: 'always'` | `alwaysApply: true`                                |
| `scope: 'auto'`   | `alwaysApply: false` + `description` (required)    |
| `scope: 'glob'`   | `globs` array                                      |
| `scope: 'manual'` | `alwaysApply: false`, no `globs`, no `description` |
| `globs`           | `globs`                                            |
| `id`              | filename stem                                      |

### Example output

```markdown
---
description: "Enforce TypeScript naming conventions"
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

Use PascalCase for types and interfaces.
Use camelCase for variables and functions.
```

### Lossy translations

- stax `priority` and `severity` have no Cursor equivalent and MUST be dropped with a warning
- stax `triggers` have no Cursor equivalent and MUST be dropped with a warning

## MCP mapping

Cursor uses `.cursor/mcp.json` for both project and user scope.

### Output format

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    },
    "remote-server": {
      "url": "https://mcp.example.com/mcp",
      "headers": {}
    }
  }
}
```

### Mapping rules

- stdio servers map to `command`, `args`, and optional `env`
- remote servers map to `url` and optional `headers`
- secret values MUST NOT be written directly; environment-variable references MAY be used
- the `disabled` field MAY be set to `true` for MCP servers marked as optional
- unsupported canonical MCP fields MUST trigger warnings

## Skills mapping

Cursor supports skills in `.cursor/skills/<name>/SKILL.md`, compatible with the stax skill format.

- target directory: `.cursor/skills/` or `~/.cursor/skills/`
- each top-level skill directory MUST be preserved
- `SKILL.md` content SHOULD be preserved byte-for-byte
- Cursor also reads `.claude/skills/` and `.agents/skills/` as compatible paths

## Legacy `.cursorrules` support

When `legacyCursorrules: true` is set, the adapter SHOULD:

1. compose all rules and instructions into a single `.cursorrules` file at the project root
2. warn that this is a deprecated path
3. not emit `.cursor/rules/` files

This mode exists for backwards compatibility with older Cursor versions.

## Feature map

```json
{
  "prompt": "native",
  "persona": "embedded",
  "rules": "translated",
  "skills": "native",
  "mcp": "translated",
  "surfaces": "embedded",
  "secrets": "consumer-only",
  "subagents": "unsupported",
  "instructionTree": "unsupported",
  "toolPermissions": "unsupported",
  "modelConfig": "unsupported",
  "exactMode": true
}
```

## What the adapter MUST NOT own

- `~/Library/Application Support/Cursor/` (app state, caches, auth)
- `.vscode/settings.json` (editor settings, not agent config)
- `.cursor/hooks.json` (lifecycle hooks are runtime-specific)
- auth tokens, credential files, or API keys
- caches, logs, session state

## Exactness requirements

An implementation claiming exact Cursor support SHOULD:

1. write `.cursor/rules/*.mdc` with correct frontmatter
2. write `.cursor/mcp.json` with `mcpServers` root key
3. preserve skill directory structure exactly
4. write `AGENTS.md` when source instructions exist
5. avoid writing state, auth, or editor-level settings
6. warn or fail when lossy translations occur in `exact` mode
