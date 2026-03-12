# 17 — Runtime File Contracts

## Overview

To support runtimes "very correctly," stax must define not just abstract layers but also the exact file contracts expected by each runtime.

This document defines:

- which files are package-managed
- which files are local-only or stateful
- which files MUST NOT be packaged
- how adapters map canonical layers and surfaces into exact runtime files

Exactness claims in this document SHOULD be interpreted together with adapter `runtimeVersionRange` declarations and conformance results. A mapping is only truly exact when it has been tested against the relevant runtime version range.

## Ownership classes

Every runtime file SHOULD be classified into one of these classes.

| Class               | Meaning                                   | Package by default? |
| ------------------- | ----------------------------------------- | ------------------- |
| `managed-user`      | Declarative user-wide config/instructions | Sometimes           |
| `managed-project`   | Declarative project/repo files            | Yes                 |
| `managed-workspace` | Declarative workspace files               | Yes                 |
| `local-override`    | User-local, non-shared overrides          | No                  |
| `state`             | Runtime state, caches, transcripts, logs  | No                  |
| `secret`            | Credentials or secret-bearing files       | No                  |

Consumers MUST NOT package `state` or `secret` files.

Consumers SHOULD NOT package `local-override` files unless the user explicitly opts in.

## Claude Code

The file-contract details below are based on Claude Code documentation for settings, memory, skills, and MCP.

### Claude scopes

| Scope          | Files                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| User           | `~/.claude/CLAUDE.md`, `~/.claude/skills/**`, `~/.claude/agents/*.md`, `~/.claude/settings.json`, `~/.claude.json`   |
| Project        | `CLAUDE.md` or `.claude/CLAUDE.md`, `.claude/skills/**`, `.claude/agents/*.md`, `.claude/settings.json`, `.mcp.json` |
| Local override | `.claude/settings.local.json`                                                                                        |

### Claude ownership classification

| Path                                            | Class                              | stax support                                                                    |
| ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `CLAUDE.md` / `.claude/CLAUDE.md`               | `managed-project`                  | Yes                                                                             |
| `.claude/skills/**`                             | `managed-project`                  | Yes                                                                             |
| `.mcp.json`                                     | `managed-project`                  | Yes                                                                             |
| `.claude/settings.json`                         | `managed-project`                  | Yes                                                                             |
| `.claude/settings.local.json`                   | `local-override`                   | No by default                                                                   |
| `~/.claude/CLAUDE.md`                           | `managed-user`                     | Optional                                                                        |
| `~/.claude/skills/**`                           | `managed-user`                     | Optional                                                                        |
| `~/.claude/settings.json`                       | `managed-user`                     | Optional                                                                        |
| `~/.claude.json`                                | `managed-user`                     | Optional, but SHOULD be avoided when project scope is possible                  |
| `.claude/agents/*.md` / `~/.claude/agents/*.md` | `managed-project` / `managed-user` | Yes via [37 — Subagents and Agent Bundles](./37-subagents-and-agent-bundles.md) |

### Claude exact mapping rules

In `exact` mode, `@stax/claude-code` SHOULD materialize:

| stax source                                        | Exact target            |
| -------------------------------------------------- | ----------------------- |
| `surfaces/instructions.md` or merged prompt output | `CLAUDE.md`             |
| `skills/`                                          | `.claude/skills/`       |
| MCP layer                                          | `.mcp.json`             |
| supported adapter config                           | `.claude/settings.json` |

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

| Scope          | Files                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User           | `~/.codex/config.toml`, `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md`, `$HOME/.agents/skills/**`                                                  |
| Project        | `.codex/config.toml`, `AGENTS.md` / `AGENTS.override.md` discovered from repo root down to cwd, `.agents/skills/**` discovered from repo root down to cwd |
| System / admin | `/etc/codex/config.toml`, `/etc/codex/skills/**`                                                                                                          |
| State          | `~/.codex/auth.json`, `~/.codex/history.jsonl`, logs, caches                                                                                              |

### Codex ownership classification

| Path                          | Class                                                | stax support                        |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `~/.codex/config.toml`        | `managed-user`                                       | Optional                            |
| `.codex/config.toml`          | `managed-project`                                    | Yes                                 |
| `~/.codex/AGENTS.md`          | `managed-user`                                       | Optional                            |
| `~/.codex/AGENTS.override.md` | `local-override`                                     | No by default                       |
| `AGENTS.md` in repo           | `managed-project`                                    | Yes                                 |
| `AGENTS.override.md` in repo  | `local-override` or team-specific override by policy | No by default                       |
| `.agents/skills/**` in repo   | `managed-project`                                    | Yes                                 |
| `$HOME/.agents/skills/**`     | `managed-user`                                       | Optional                            |
| `/etc/codex/skills/**`        | `managed-user` or admin-managed external policy      | No by default for portable packages |
| `~/.codex/auth.json`          | `secret`                                             | No                                  |
| `~/.codex/history.jsonl`      | `state`                                              | No                                  |
| `~/.codex/logs/**`, caches    | `state`                                              | No                                  |

### Codex exact mapping rules

In `exact` mode, `@stax/codex` SHOULD materialize:

| stax source                                        | Exact target                                     |
| -------------------------------------------------- | ------------------------------------------------ |
| `surfaces/instructions.md` or merged prompt output | `AGENTS.md`                                      |
| supported adapter config                           | `.codex/config.toml`                             |
| skills                                             | `.agents/skills/**`                              |
| MCP layer                                          | `[mcp_servers.*]` tables in `.codex/config.toml` |

#### Codex instruction discovery semantics

Codex instruction loading is path-sensitive.

Consumers targeting Codex SHOULD preserve these semantics:

1. user scope: `~/.codex/AGENTS.override.md` wins over `~/.codex/AGENTS.md`
2. project scope: from repo root to cwd, Codex checks each directory for `AGENTS.override.md`, then `AGENTS.md`
3. at most one instruction file per directory is included
4. files closer to cwd override earlier guidance because they appear later in the combined prompt

stax supports both a canonical instruction surface and a canonical instruction tree. Therefore:

- a single stax agent MAY target one exact project `AGENTS.md`
- artifacts that include [38 — Instruction Trees](./38-instruction-trees.md) MAY represent an entire discovered multi-directory AGENTS hierarchy

### Codex files that MUST NOT be packaged

- `~/.codex/auth.json`
- `~/.codex/history.jsonl`
- logs and caches
- approval history or ephemeral trust state
- local override files unless explicitly requested

## OpenClaw

The file-contract details below are based on OpenClaw workspace and system-prompt documentation.

### OpenClaw scopes

| Scope         | Files                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace     | `<workspace>/AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `skills/**`, `memory/**`, optional `MEMORY.md` |
| User          | `~/.openclaw/skills/**`, `~/.openclaw/openclaw.json` when managed as a runtime profile                                                                   |
| Runtime state | `~/.openclaw/credentials/**`, `~/.openclaw/agents/**/sessions/**`                                                                                        |

### OpenClaw ownership classification

| Path                                | Class                                                                            | stax support                                            |
| ----------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `<workspace>/AGENTS.md`             | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/SOUL.md`               | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/TOOLS.md`              | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/IDENTITY.md`           | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/USER.md`               | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/HEARTBEAT.md`          | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/BOOTSTRAP.md`          | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/skills/**`             | `managed-workspace`                                                              | Yes                                                     |
| `<workspace>/memory/**`             | `managed-workspace`                                                              | Yes                                                     |
| `~/.openclaw/skills/**`             | `managed-user`                                                                   | Optional                                                |
| `~/.openclaw/openclaw.json`         | `managed-user` in a runtime-profile artifact; otherwise extrinsic runtime config | Not in agent artifacts; yes in `@stax/openclaw/profile` |
| `~/.openclaw/credentials/**`        | `secret`                                                                         | No                                                      |
| `~/.openclaw/agents/**/sessions/**` | `state`                                                                          | No                                                      |

### OpenClaw exact mapping rules

In `exact` mode, `@stax/openclaw` MUST preserve separate files and MUST NOT collapse them into a single prompt.

| stax source                | Exact target               |
| -------------------------- | -------------------------- |
| `surfaces/instructions.md` | `<workspace>/AGENTS.md`    |
| `surfaces/persona.md`      | `<workspace>/SOUL.md`      |
| `surfaces/tools.md`        | `<workspace>/TOOLS.md`     |
| `surfaces/identity.md`     | `<workspace>/IDENTITY.md`  |
| `surfaces/user.md`         | `<workspace>/USER.md`      |
| `surfaces/heartbeat.md`    | `<workspace>/HEARTBEAT.md` |
| `surfaces/bootstrap.md`    | `<workspace>/BOOTSTRAP.md` |
| `skills/`                  | `<workspace>/skills/`      |
| `memory/`                  | `<workspace>/memory/`      |

If a required OpenClaw surface is missing in `exact` mode, the consumer SHOULD either:

1. fail, or
2. write no file and emit a clear warning that OpenClaw will inject a missing-file marker at runtime

### OpenClaw files that MUST NOT be packaged in agent artifacts

- `~/.openclaw/credentials/**`
- session transcripts and logs
- generated runtime state

`~/.openclaw/openclaw.json` is intentionally excluded from agent artifacts, but MAY be packaged separately via [21 — Profile: `@stax/openclaw/profile`](./21-openclaw-profile.md).

## Cursor

The file-contract details below are based on Cursor IDE documentation for rules, MCP, skills, and hooks.

### Cursor scopes

| Scope   | Files                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------- |
| Project | `.cursor/rules/*.mdc`, `.cursor/mcp.json`, `.cursor/skills/**`, `.cursor/hooks.json`, `AGENTS.md` |
| User    | `~/.cursor/rules/*.mdc`, `~/.cursor/mcp.json`, `~/.cursor/skills/**`, `~/.cursor/hooks.json`      |
| Legacy  | `.cursorrules` (project root, deprecated)                                                         |

### Cursor ownership classification

| Path                                    | Class             | stax support  |
| --------------------------------------- | ----------------- | ------------- |
| `.cursor/rules/*.mdc`                   | `managed-project` | Yes           |
| `.cursor/mcp.json`                      | `managed-project` | Yes           |
| `.cursor/skills/**`                     | `managed-project` | Yes           |
| `AGENTS.md`                             | `managed-project` | Yes           |
| `.cursorrules`                          | `managed-project` | Yes (legacy)  |
| `~/.cursor/rules/*.mdc`                 | `managed-user`    | Optional      |
| `~/.cursor/mcp.json`                    | `managed-user`    | Optional      |
| `~/.cursor/skills/**`                   | `managed-user`    | Optional      |
| `.cursor/hooks.json`                    | `local-override`  | No by default |
| `~/Library/Application Support/Cursor/` | `state`           | No            |

### Cursor exact mapping rules

In `exact` mode, `@stax/cursor` SHOULD materialize:

| stax source                                        | Exact target                                   |
| -------------------------------------------------- | ---------------------------------------------- |
| `surfaces/instructions.md` or merged prompt output | `AGENTS.md`                                    |
| canonical rules                                    | `.cursor/rules/*.mdc` with trigger frontmatter |
| MCP layer                                          | `.cursor/mcp.json`                             |
| skills                                             | `.cursor/skills/**`                            |

### Cursor files that MUST NOT be packaged

- `~/Library/Application Support/Cursor/` (app state, caches, auth)
- `.vscode/settings.json` (editor settings)
- env values containing secrets in `.cursor/mcp.json`
- auth tokens, session state, caches

## GitHub Copilot

The file-contract details below are based on GitHub Copilot documentation for custom instructions, MCP, skills, and agents.

### Copilot scopes

| Scope     | Files                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `.github/agents/*.agent.md`, `.github/skills/**`, `.github/prompts/*.prompt.md`, `.vscode/mcp.json`, `AGENTS.md` |
| User      | `~/.copilot/instructions/*.instructions.md`, `~/.copilot/agents/*.agent.md`, `~/.copilot/skills/**`                                                                                           |

### Copilot ownership classification

| Path                                        | Class             | stax support  |
| ------------------------------------------- | ----------------- | ------------- |
| `.github/copilot-instructions.md`           | `managed-project` | Yes           |
| `.github/instructions/*.instructions.md`    | `managed-project` | Yes           |
| `.vscode/mcp.json`                          | `managed-project` | Yes           |
| `.github/skills/**`                         | `managed-project` | Yes           |
| `AGENTS.md`                                 | `managed-project` | Yes           |
| `.github/agents/*.agent.md`                 | `managed-project` | Optional      |
| `.github/prompts/*.prompt.md`               | `managed-project` | No by default |
| `~/.copilot/instructions/*.instructions.md` | `managed-user`    | Optional      |
| `~/.copilot/skills/**`                      | `managed-user`    | Optional      |
| VS Code user `settings.json`                | `local-override`  | No            |

### Copilot exact mapping rules

In `exact` mode, `@stax/github-copilot` SHOULD materialize:

| stax source                                        | Exact target                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `surfaces/instructions.md` or merged prompt output | `.github/copilot-instructions.md`                                           |
| canonical rules (glob-scoped)                      | `.github/instructions/<rule-id>.instructions.md` with `applyTo` frontmatter |
| canonical rules (always)                           | embedded in `.github/copilot-instructions.md`                               |
| MCP layer                                          | `.vscode/mcp.json` with `servers` root key and explicit `type` fields       |
| skills                                             | `.github/skills/**`                                                         |

### Copilot files that MUST NOT be packaged

- VS Code user settings
- auth tokens or GitHub credentials
- `.github/prompts/*.prompt.md` (user-authored, not stax-managed)
- `.github/agents/*.agent.md` unless explicitly opted in

## Windsurf

The file-contract details below are based on Windsurf (formerly Codeium) documentation for rules, workflows, and MCP.

### Windsurf scopes

| Scope               | Files                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Project             | `.windsurf/rules/*.md`, `.windsurf/workflows/*.md`, `AGENTS.md`                                                                    |
| User                | `~/.codeium/windsurf/memories/global_rules.md`, `~/.codeium/windsurf/global_workflows/*.md`, `~/.codeium/windsurf/mcp_config.json` |
| Legacy              | `.windsurfrules` (project root, deprecated)                                                                                        |
| System (enterprise) | `/Library/Application Support/Windsurf/rules/*.md` (macOS), `/etc/windsurf/rules/*.md` (Linux)                                     |

### Windsurf ownership classification

| Path                                             | Class             | stax support                |
| ------------------------------------------------ | ----------------- | --------------------------- |
| `.windsurf/rules/*.md`                           | `managed-project` | Yes                         |
| `.windsurf/workflows/*.md`                       | `managed-project` | Yes                         |
| `AGENTS.md`                                      | `managed-project` | Yes                         |
| `.windsurfrules`                                 | `managed-project` | Yes (legacy)                |
| `~/.codeium/windsurf/memories/global_rules.md`   | `managed-user`    | Optional                    |
| `~/.codeium/windsurf/global_workflows/*.md`      | `managed-user`    | Optional                    |
| `~/.codeium/windsurf/mcp_config.json`            | `managed-user`    | Optional (user-scoped only) |
| `~/.codeium/windsurf/memories/` (auto-generated) | `state`           | No                          |
| `~/Library/Application Support/Windsurf/`        | `state`           | No                          |

### Windsurf exact mapping rules

In `exact` mode, `@stax/windsurf` SHOULD materialize:

| stax source                                        | Exact target                                    |
| -------------------------------------------------- | ----------------------------------------------- |
| `surfaces/instructions.md` or merged prompt output | `AGENTS.md`                                     |
| canonical rules                                    | `.windsurf/rules/*.md` with trigger frontmatter |
| skills (as workflows)                              | `.windsurf/workflows/*.md`                      |

MCP is user-scoped only in Windsurf. The adapter MUST warn that project-level MCP is not supported.

### Windsurf files that MUST NOT be packaged

- `~/.codeium/windsurf/memories/` (auto-generated memories)
- `~/Library/Application Support/Windsurf/` (app state, caches, auth)
- `~/.codeium/.codeiumignore` (enterprise-specific)
- auth tokens, credential files, session state

## OpenCode

The file-contract details below are based on [OpenCode](https://github.com/anomalyco/opencode) by Anomaly for config, instructions, skills, commands, and MCP.

### OpenCode scopes

| Scope      | Files                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Project    | `opencode.jsonc`, `AGENTS.md`, `.opencode/command/*.md`, `.opencode/skill/**/SKILL.md`, `.opencode/agent/*.md`, `.opencode/plugin/*.ts` |
| User       | `~/.config/opencode/opencode.jsonc`, `~/.config/opencode/AGENTS.md`, `~/.opencode/command/*.md`, `~/.opencode/skill/**/SKILL.md`        |
| Enterprise | `/Library/Application Support/opencode/` (macOS), `/etc/opencode/` (Linux), `C:\ProgramData\opencode\` (Windows)                        |
| State      | `~/.local/state/opencode/`, `~/.cache/opencode/`, `.opencode/plans/`                                                                    |

### OpenCode ownership classification

| Path                                | Class             | stax support  |
| ----------------------------------- | ----------------- | ------------- |
| `opencode.jsonc`                    | `managed-project` | Yes           |
| `AGENTS.md`                         | `managed-project` | Yes           |
| `.opencode/command/*.md`            | `managed-project` | Yes           |
| `.opencode/skill/**/SKILL.md`       | `managed-project` | Yes           |
| `.opencode/agent/*.md`              | `managed-project` | Optional      |
| `~/.config/opencode/opencode.jsonc` | `managed-user`    | Optional      |
| `~/.config/opencode/AGENTS.md`      | `managed-user`    | Optional      |
| `~/.opencode/command/*.md`          | `managed-user`    | Optional      |
| `~/.opencode/skill/**/SKILL.md`     | `managed-user`    | Optional      |
| `.opencode/plans/`                  | `state`           | No            |
| `.opencode/node_modules/`           | `state`           | No            |
| `.opencode/package.json`            | `state`           | No            |
| `~/.local/state/opencode/`          | `state`           | No            |
| `~/.cache/opencode/`                | `state`           | No            |
| `*.local.md` files                  | `local-override`  | No by default |

### OpenCode exact mapping rules

In `exact` mode, `@stax/opencode` SHOULD materialize:

| stax source                                        | Exact target                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `surfaces/instructions.md` or merged prompt output | `AGENTS.md`                                                                              |
| MCP layer                                          | `opencode.jsonc` under `mcp` (local: `command` as string array, `environment` as object) |
| adapter config (model, agents)                     | `opencode.jsonc`                                                                         |
| skills                                             | `.opencode/skill/**/SKILL.md`                                                            |
| skills (as commands)                               | `.opencode/command/*.md`                                                                 |

### OpenCode files that MUST NOT be packaged

- `.opencode/plans/` (runtime-generated plan state)
- `.opencode/node_modules/`, `.opencode/package.json`, `.opencode/bun.lock` (auto-generated plugin artifacts)
- `~/.local/state/opencode/` (SQLite databases, runtime state)
- `~/.local/share/opencode/` (binaries, logs)
- `~/.cache/opencode/` (cached data)
- OAuth tokens and auth state
- API keys in `provider` config
- `*.local.md` files (local instruction overrides)

## Exactness requirements

To claim support for a runtime "correctly," an adapter SHOULD:

1. declare the exact runtime version range it targets
2. enumerate exact file paths and scopes
3. define byte-preserving mappings where possible
4. fail or warn on lossy synthesis in `exact` mode
5. ship conformance tests against a real runtime version
