# 20 — Adapter: `@stax/codex`

## Overview

`@stax/codex` is the canonical stax adapter for Codex.

Codex differs from Claude Code and OpenClaw in two important ways:

1. instructions are discovered through `AGENTS.md` / `AGENTS.override.md` files along the directory path
2. MCP, sandboxing, approvals, and some skill controls live in TOML configuration (`config.toml`)

This adapter targets the documented Codex file contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Scope model

| Scope          | Typical files                                                           |
| -------------- | ----------------------------------------------------------------------- |
| User           | `~/.codex/config.toml`, `~/.codex/AGENTS.md`, `$HOME/.agents/skills/**` |
| Project        | `.codex/config.toml`, `AGENTS.md`, `.agents/skills/**`                  |
| System / admin | `/etc/codex/config.toml`, `/etc/codex/skills/**`                        |
| State          | `~/.codex/auth.json`, `~/.codex/history.jsonl`, logs, caches            |

In stax `1.0.0`, `@stax/codex` SHOULD default to **project scope**.

## Adapter interface

```typescript
interface CodexAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  scope?: "project" | "user";
  exact?: boolean;

  approval?: "untrusted" | "on-request" | "never";
  sandbox?: "read-only" | "workspace-write" | "danger-full-access";
  allowLoginShell?: boolean;

  writeConfig?: boolean; // default: true
  writeInstructions?: boolean; // default: true
  writeSkills?: boolean; // default: true
  writeMcp?: boolean; // default: true

  config?: Record<string, unknown>; // extra Codex TOML keys
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "codex",
  "runtime": "codex",
  "adapterVersion": "1.0.0"
}
```

## Exact target mapping

### Project scope

| stax source                                   | Target                                       |
| --------------------------------------------- | -------------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `AGENTS.md`                                  |
| `instructionTree`                             | `<scoped-path>/AGENTS.md`                    |
| skills                                        | `.agents/skills/**`                          |
| MCP layer                                     | `.codex/config.toml` under `[mcp_servers.*]` |
| adapter config                                | `.codex/config.toml`                         |

### User scope

| stax source                                   | Target                                         |
| --------------------------------------------- | ---------------------------------------------- |
| `surfaces/instructions.md` or composed prompt | `~/.codex/AGENTS.md`                           |
| skills                                        | `$HOME/.agents/skills/**`                      |
| MCP layer                                     | `~/.codex/config.toml` under `[mcp_servers.*]` |
| adapter config                                | `~/.codex/config.toml`                         |

## `AGENTS.md` behavior

Codex instruction discovery is hierarchical.

### Documented behavior

- In `CODEX_HOME` (default `~/.codex`), Codex reads `AGENTS.override.md` if present, otherwise `AGENTS.md`
- In a project, Codex walks from repo root down to the current directory
- In each directory, it checks `AGENTS.override.md` first, then `AGENTS.md`
- It includes at most one instruction file per directory
- Files closer to the current directory appear later and therefore override earlier guidance

### stax mapping policy

stax supports both one canonical instruction surface and an optional instruction tree:

- without `instructionTree`, `@stax/codex` targets one exact file location at a time
- with [38 — Instruction Trees](./38-instruction-trees.md), the adapter MAY materialize a discovered multi-directory AGENTS hierarchy

Root mapping remains:

- project root `AGENTS.md`, or
- user `~/.codex/AGENTS.md`

## `config.toml` generation

Codex stores runtime configuration, MCP config, approval policy, and sandbox policy in TOML.

### Example output

```toml
model = "gpt-5-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
allow_login_shell = false

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.context7.env]
MY_ENV_VAR = "MY_ENV_VALUE"
```

### Mapping rules

- `model` maps from adapter `model`
- approval and sandbox options map to top-level TOML keys
- canonical MCP servers map to `[mcp_servers.<name>]` tables
- stdio server env maps to `[mcp_servers.<name>.env]`
- remote servers map to `url` and related supported fields
- unsupported canonical fields MUST trigger warnings

## Skills mapping

Codex scans skills from several locations. stax SHOULD materialize project skills into:

```text
.agents/skills/<skill>/SKILL.md
```

and user skills into:

```text
$HOME/.agents/skills/<skill>/SKILL.md
```

Rules:

- preserve the skill directory exactly
- preserve `SKILL.md` bytes exactly
- preserve support files exactly
- do not rewrite runtime-specific skill metadata unless required by policy

## Approval and sandbox defaults

Codex exposes approval and sandboxing as first-class config.

The adapter SHOULD map:

- stax capability hints into suggested defaults where reasonable
- but MUST preserve explicit adapter options over generic hints

Example policy:

- `hints.capabilities.shell = true` does not automatically imply `danger-full-access`
- explicit `sandbox: 'workspace-write'` wins over inferred settings

## What the adapter MUST NOT own

`@stax/codex` MUST NOT package or write by default:

- `~/.codex/auth.json`
- `~/.codex/history.jsonl`
- logs and caches
- ephemeral trust or approval state
- admin-wide `/etc/codex/**` files unless explicitly requested by an administrator

## Exactness requirements

An implementation claiming exact Codex support SHOULD:

1. write valid TOML to `.codex/config.toml` or `~/.codex/config.toml`
2. preserve project skill directories under `.agents/skills/`
3. write exact `AGENTS.md` when source instructions exist
4. materialize instruction-tree entries to scoped `AGENTS.md` files when present
5. avoid writing state or credential files
6. warn or fail when composition or unsupported TOML fields make output lossy
