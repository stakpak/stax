# 17 — Runtime File Contracts

## Overview

To support runtimes "very correctly," stax must define not just abstract layers but also the exact file contracts expected by each runtime.

This document defines:

- which files are package-managed
- which files are local-only or stateful
- which files MUST NOT be packaged
- how adapters map canonical layers and surfaces into exact runtime files

## Ownership classes

Every runtime file SHOULD be classified into one of these classes.

| Class | Meaning | Package by default? |
|------|---------|---------------------|
| `managed-user` | Declarative user-wide config/instructions | Sometimes |
| `managed-project` | Declarative project/repo files | Yes |
| `managed-workspace` | Declarative workspace files | Yes |
| `local-override` | User-local, non-shared overrides | No |
| `state` | Runtime state, caches, transcripts, logs | No |
| `secret` | Credentials or secret-bearing files | No |

Consumers MUST NOT package `state` or `secret` files.

Consumers SHOULD NOT package `local-override` files unless the user explicitly opts in.

## Claude Code

The file-contract details below are based on Claude Code documentation for settings, memory, skills, and MCP.

### Claude scopes

| Scope | Files |
|------|-------|
| User | `~/.claude/CLAUDE.md`, `~/.claude/skills/**`, `~/.claude/agents/*.md`, `~/.claude/settings.json`, `~/.claude.json` |
| Project | `CLAUDE.md` or `.claude/CLAUDE.md`, `.claude/skills/**`, `.claude/agents/*.md`, `.claude/settings.json`, `.mcp.json` |
| Local override | `.claude/settings.local.json` |

### Claude ownership classification

| Path | Class | stax support |
|------|-------|--------------|
| `CLAUDE.md` / `.claude/CLAUDE.md` | `managed-project` | Yes |
| `.claude/skills/**` | `managed-project` | Yes |
| `.mcp.json` | `managed-project` | Yes |
| `.claude/settings.json` | `managed-project` | Yes |
| `.claude/settings.local.json` | `local-override` | No by default |
| `~/.claude/CLAUDE.md` | `managed-user` | Optional |
| `~/.claude/skills/**` | `managed-user` | Optional |
| `~/.claude/settings.json` | `managed-user` | Optional |
| `~/.claude.json` | `managed-user` | Optional, but SHOULD be avoided when project scope is possible |
| `.claude/agents/*.md` / `~/.claude/agents/*.md` | `managed-project` / `managed-user` | Future subagent support |

### Claude exact mapping rules

In `exact` mode, `@stax/claude-code` SHOULD materialize:

| stax source | Exact target |
|------------|--------------|
| `surfaces/instructions.md` or merged prompt output | `CLAUDE.md` |
| `skills/` | `.claude/skills/` |
| MCP layer | `.mcp.json` |
| supported adapter config | `.claude/settings.json` |

#### CLAUDE.md composition order

When a consumer must synthesize `CLAUDE.md`, it SHOULD render sections in this order:

1. `surfaces/instructions.md`
2. `prompt`
3. rendered persona summary or `surfaces/persona.md`
4. canonical rules translated to Markdown
5. `surfaces/tools.md`
6. `surfaces/identity.md`
7. `surfaces/user.md`
8. `surfaces/heartbeat.md`

In `exact` mode, if `CLAUDE.md` must be synthesized because no exact source document exists, the consumer MUST warn or fail according to policy.

### Claude files that MUST NOT be packaged

- auth tokens
- caches
- session transcripts
- `.claude/settings.local.json` unless explicitly requested
- undocumented internal state files

## Codex

The file-contract details below are based on Codex documentation for `AGENTS.md`, config, MCP, skills, sandboxing, and approvals.

### Codex scopes

| Scope | Files |
|------|-------|
| User | `~/.codex/config.toml`, `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md`, `$HOME/.agents/skills/**` |
| Project | `.codex/config.toml`, `AGENTS.md` / `AGENTS.override.md` discovered from repo root down to cwd, `.agents/skills/**` discovered from repo root down to cwd |
| System / admin | `/etc/codex/config.toml`, `/etc/codex/skills/**` |
| State | `~/.codex/auth.json`, `~/.codex/history.jsonl`, logs, caches |

### Codex ownership classification

| Path | Class | stax support |
|------|-------|--------------|
| `~/.codex/config.toml` | `managed-user` | Optional |
| `.codex/config.toml` | `managed-project` | Yes |
| `~/.codex/AGENTS.md` | `managed-user` | Optional |
| `~/.codex/AGENTS.override.md` | `local-override` | No by default |
| `AGENTS.md` in repo | `managed-project` | Yes |
| `AGENTS.override.md` in repo | `local-override` or team-specific override by policy | No by default |
| `.agents/skills/**` in repo | `managed-project` | Yes |
| `$HOME/.agents/skills/**` | `managed-user` | Optional |
| `/etc/codex/skills/**` | `managed-user` or admin-managed external policy | No by default for portable packages |
| `~/.codex/auth.json` | `secret` | No |
| `~/.codex/history.jsonl` | `state` | No |
| `~/.codex/logs/**`, caches | `state` | No |

### Codex exact mapping rules

In `exact` mode, `@stax/codex` SHOULD materialize:

| stax source | Exact target |
|------------|--------------|
| `surfaces/instructions.md` or merged prompt output | `AGENTS.md` |
| supported adapter config | `.codex/config.toml` |
| skills | `.agents/skills/**` |
| MCP layer | `[mcp_servers.*]` tables in `.codex/config.toml` |

#### Codex instruction discovery semantics

Codex instruction loading is path-sensitive.

Consumers targeting Codex SHOULD preserve these semantics:

1. user scope: `~/.codex/AGENTS.override.md` wins over `~/.codex/AGENTS.md`
2. project scope: from repo root to cwd, Codex checks each directory for `AGENTS.override.md`, then `AGENTS.md`
3. at most one instruction file per directory is included
4. files closer to cwd override earlier guidance because they appear later in the combined prompt

stax packages a canonical instruction surface, not an entire discovered tree. Therefore:

- a single stax agent MAY target one exact project `AGENTS.md`
- packaging an entire discovered multi-directory AGENTS tree requires either multiple package artifacts or a future multi-path instructions extension

### Codex files that MUST NOT be packaged

- `~/.codex/auth.json`
- `~/.codex/history.jsonl`
- logs and caches
- approval history or ephemeral trust state
- local override files unless explicitly requested

## OpenClaw

The file-contract details below are based on OpenClaw workspace and system-prompt documentation.

### OpenClaw scopes

| Scope | Files |
|------|-------|
| Workspace | `<workspace>/AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `skills/**`, `memory/**`, optional `MEMORY.md` |
| User | `~/.openclaw/skills/**`, `~/.openclaw/openclaw.json` when managed as a runtime profile |
| Runtime state | `~/.openclaw/credentials/**`, `~/.openclaw/agents/**/sessions/**` |

### OpenClaw ownership classification

| Path | Class | stax support |
|------|-------|--------------|
| `<workspace>/AGENTS.md` | `managed-workspace` | Yes |
| `<workspace>/SOUL.md` | `managed-workspace` | Yes |
| `<workspace>/TOOLS.md` | `managed-workspace` | Yes |
| `<workspace>/IDENTITY.md` | `managed-workspace` | Yes |
| `<workspace>/USER.md` | `managed-workspace` | Yes |
| `<workspace>/HEARTBEAT.md` | `managed-workspace` | Yes |
| `<workspace>/BOOTSTRAP.md` | `managed-workspace` | Yes |
| `<workspace>/skills/**` | `managed-workspace` | Yes |
| `<workspace>/memory/**` | `managed-workspace` | Yes |
| `~/.openclaw/skills/**` | `managed-user` | Optional |
| `~/.openclaw/openclaw.json` | `managed-user` in a runtime-profile artifact; otherwise extrinsic runtime config | Not in agent artifacts; yes in `@stax/openclaw/profile` |
| `~/.openclaw/credentials/**` | `secret` | No |
| `~/.openclaw/agents/**/sessions/**` | `state` | No |

### OpenClaw exact mapping rules

In `exact` mode, `@stax/openclaw` MUST preserve separate files and MUST NOT collapse them into a single prompt.

| stax source | Exact target |
|------------|--------------|
| `surfaces/instructions.md` | `<workspace>/AGENTS.md` |
| `surfaces/persona.md` | `<workspace>/SOUL.md` |
| `surfaces/tools.md` | `<workspace>/TOOLS.md` |
| `surfaces/identity.md` | `<workspace>/IDENTITY.md` |
| `surfaces/user.md` | `<workspace>/USER.md` |
| `surfaces/heartbeat.md` | `<workspace>/HEARTBEAT.md` |
| `surfaces/bootstrap.md` | `<workspace>/BOOTSTRAP.md` |
| `skills/` | `<workspace>/skills/` |
| `memory/` | `<workspace>/memory/` |

If a required OpenClaw surface is missing in `exact` mode, the consumer SHOULD either:

1. fail, or
2. write no file and emit a clear warning that OpenClaw will inject a missing-file marker at runtime

### OpenClaw files that MUST NOT be packaged in agent artifacts

- `~/.openclaw/credentials/**`
- session transcripts and logs
- generated runtime state

`~/.openclaw/openclaw.json` is intentionally excluded from agent artifacts, but MAY be packaged separately via [21 — Profile: `@stax/openclaw/profile`](./21-openclaw-profile.md).

## Exactness requirements

To claim support for a runtime "correctly," an adapter SHOULD:

1. declare the exact runtime version range it targets
2. enumerate exact file paths and scopes
3. define byte-preserving mappings where possible
4. fail or warn on lossy synthesis in `exact` mode
5. ship conformance tests against a real runtime version
