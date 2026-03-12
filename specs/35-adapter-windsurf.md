# 35 — Adapter: `@stax/windsurf`

## Overview

`@stax/windsurf` is the canonical stax adapter for Windsurf (formerly Codeium).

Windsurf's Cascade agent uses `.windsurf/rules/*.md` for rules, `.windsurf/workflows/*.md` for workflows, and `AGENTS.md` for always-on instructions. MCP is configured at the user level only via `~/.codeium/windsurf/mcp_config.json`.

This adapter targets the documented Windsurf file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

| Scope               | Typical files                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Project             | `.windsurf/rules/*.md`, `.windsurf/workflows/*.md`, `AGENTS.md`                                                                    |
| User                | `~/.codeium/windsurf/memories/global_rules.md`, `~/.codeium/windsurf/global_workflows/*.md`, `~/.codeium/windsurf/mcp_config.json` |
| Legacy              | `.windsurfrules` (project root, deprecated in favor of `.windsurf/rules/`)                                                         |
| System (enterprise) | `/Library/Application Support/Windsurf/rules/*.md` (macOS), `/etc/windsurf/rules/*.md` (Linux)                                     |

In stax `1.0.0`, `@stax/windsurf` SHOULD default to **project scope**.

## Adapter interface

```typescript
interface WindsurfAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: "project" | "user";
  exact?: boolean;

  writeRules?: boolean; // default: true
  writeWorkflows?: boolean; // default: false — workflows are user-authored
  writeMcp?: boolean; // default: true
  writeInstructions?: boolean; // default: true

  legacyWindsurfrules?: boolean; // default: false — emit .windsurfrules instead of .windsurf/rules/

  config?: Record<string, unknown>; // Windsurf-specific settings
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "windsurf",
  "runtime": "windsurf",
  "adapterVersion": "1.0.0"
}
```

## Exact target mapping

### Project scope

| stax source                                   | Target                     |
| --------------------------------------------- | -------------------------- |
| `surfaces/instructions.md` or composed prompt | `AGENTS.md`                |
| rules                                         | `.windsurf/rules/*.md`     |
| skills (as workflows)                         | `.windsurf/workflows/*.md` |

### User scope

| stax source                                   | Target                                         |
| --------------------------------------------- | ---------------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `~/.codeium/windsurf/memories/global_rules.md` |
| MCP layer                                     | `~/.codeium/windsurf/mcp_config.json`          |
| skills (as workflows)                         | `~/.codeium/windsurf/global_workflows/*.md`    |

## `AGENTS.md` generation

Windsurf supports `AGENTS.md` at the project root as an always-on instruction file. Subdirectory `AGENTS.md` files are auto-scoped to their directory.

The adapter SHOULD choose the first available source in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. synthesized composition

In `exact` mode, if composition is required because no exact source document exists, the consumer MUST warn or fail according to policy.

## Rules mapping

Windsurf uses `.md` files in `.windsurf/rules/` with YAML frontmatter.

### Rule translation

Each canonical stax rule SHOULD be translated to a `.windsurf/rules/<rule-id>.md` file with the following frontmatter mapping:

| stax rule field   | Windsurf frontmatter field                           |
| ----------------- | ---------------------------------------------------- |
| `scope: 'always'` | `trigger: always_on`                                 |
| `scope: 'auto'`   | `trigger: model_decision` + `description` (required) |
| `scope: 'glob'`   | `trigger: glob` + `globs`                            |
| `scope: 'manual'` | `trigger: manual`                                    |
| `globs`           | `globs`                                              |
| `id`              | filename stem                                        |

### Example output

```markdown
---
trigger: model_decision
description: "Enforce TypeScript naming conventions"
---

Use PascalCase for types and interfaces.
Use camelCase for variables and functions.
```

### Character limits

- individual rule files: 12,000 characters
- combined global + workspace rules budget: 12,000 characters in prompt

The adapter SHOULD warn when a translated rule exceeds the 12,000 character limit.

### Lossy translations

- stax `priority` and `severity` have no Windsurf equivalent and MUST be dropped with a warning
- stax `triggers` have no Windsurf equivalent beyond the trigger mode and MUST be dropped with a warning

## MCP mapping

Windsurf stores MCP configuration at the **user level only** in `~/.codeium/windsurf/mcp_config.json`.

There is no project-level MCP configuration in Windsurf. This is a significant difference from other runtimes.

### Output format

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "remote-server": {
      "serverUrl": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:AUTH_TOKEN}"
      }
    }
  }
}
```

### Key differences from other runtimes

- MCP is **user-scoped only** — no project-level `.windsurf/mcp.json`
- remote HTTP transport uses `serverUrl` (not `url`)
- SSE transport uses `url`
- environment variable interpolation uses `${env:VARIABLE_NAME}` syntax
- tool limit: 100 total tools across all MCP servers

### Mapping rules

- stdio servers map to `command`, `args`, and optional `env`
- remote HTTP servers map to `serverUrl` and optional `headers`
- SSE servers map to `url` and optional `headers`
- secret values SHOULD use `${env:VARIABLE}` syntax
- the adapter MUST warn that MCP config is user-scoped and not project-portable
- unsupported canonical MCP fields MUST trigger warnings

## Skills-to-workflows mapping

Windsurf does not have a native skill format. Instead, it uses **workflows** — Markdown files invoked via `/workflow-name`.

stax skills MAY be translated to `.windsurf/workflows/<skill-name>.md`:

- workflow files do not use YAML frontmatter
- the skill content SHOULD be adapted to workflow format (numbered steps)
- workflows are manual-only (never auto-invoked by Cascade)
- 12,000 character limit per workflow file

This translation is inherently lossy because:

- skill frontmatter fields (`argument-hint`, `user-invocable`, etc.) have no workflow equivalent
- skills may be auto-invocable; workflows are manual-only

The adapter MUST warn when translating skills to workflows.

## Legacy `.windsurfrules` support

When `legacyWindsurfrules: true` is set, the adapter SHOULD:

1. compose all rules and instructions into a single `.windsurfrules` file at the project root
2. warn that this is a deprecated path and has a 6,000 character limit
3. not emit `.windsurf/rules/` files

## Feature map

```json
{
  "prompt": "native",
  "persona": "embedded",
  "rules": "translated",
  "skills": "translated",
  "mcp": "translated",
  "surfaces": "embedded",
  "secrets": "consumer-only",
  "toolPermissions": "unsupported",
  "modelConfig": "unsupported",
  "exactMode": true
}
```

## What the adapter MUST NOT own

- `~/.codeium/windsurf/memories/` (auto-generated memories, per-workspace state)
- `~/Library/Application Support/Windsurf/` (app state, caches, auth)
- `~/.codeium/.codeiumignore` (enterprise-specific)
- auth tokens, credential files
- session state, logs, caches

## Exactness requirements

An implementation claiming exact Windsurf support SHOULD:

1. write `.windsurf/rules/*.md` with correct trigger frontmatter
2. write `AGENTS.md` when source instructions exist
3. warn that MCP config is user-scoped only
4. warn when skills are translated to workflows
5. respect the 12,000 character limit per rule file
6. avoid writing state, auth, or app-level settings
7. warn or fail when lossy translations occur in `exact` mode
