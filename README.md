# stax

The package manager for AI agents. Build, distribute, and install agent definitions across any coding assistant runtime.

stax is to agents what OCI is to containers: a standard way to describe, package, version, distribute, and install agent artifacts.

## What it does

Define your agent once — persona, prompt, skills, rules, MCP servers, subagents, knowledge, secrets — then materialize it into the native format of any supported runtime:

- **Claude Code** (CLAUDE.md, .mcp.json, .claude/skills/, .claude/agents/)
- **Cursor** (AGENTS.md, .cursor/rules/, .cursor/mcp.json)
- **GitHub Copilot** (.github/copilot-instructions.md, .vscode/mcp.json)
- **Codex** (AGENTS.md, .codex/config.toml, .agents/skills/)
- **Windsurf** (AGENTS.md, .windsurf/rules/, .windsurf/workflows/)
- **OpenCode** (AGENTS.md, opencode.jsonc, .opencode/skill/)
- **OpenClaw** (AGENTS.md, SOUL.md, TOOLS.md, skills/, memory/)

## Quickstart

```bash
pnpm install
```

### Define an agent

```ts
// agent.ts
import { defineAgent } from "@stax/core";
import claudeCode from "@stax/adapter-claude-code";

export default defineAgent({
  name: "my-agent",
  version: "1.0.0",
  description: "A helpful coding assistant",
  adapter: claudeCode(),
  prompt: "./prompt.md",
  persona: "./persona.json",
  skills: "./skills/",
  rules: "./rules/",
  mcp: "./mcp.json",
});
```

### Build

```bash
stax build agent.ts
```

Produces a deterministic OCI artifact with content-addressable layers — one per layer type (prompt, persona, skills, rules, MCP, etc.), ordered canonically for stable digests.

### Push / Pull

```bash
stax push ghcr.io/myorg/my-agent:1.0.0
stax pull ghcr.io/myorg/my-agent:1.0.0
```

Uses the OCI Distribution Spec. Works with any OCI-compatible registry (GHCR, Docker Hub, ECR, etc.).

### Materialize

```bash
stax materialize ghcr.io/myorg/my-agent:1.0.0 --adapter cursor
```

Translates the canonical artifact into the target runtime's native file format.

### Plan Install

```bash
stax plan-install ghcr.io/myorg/my-agent:1.0.0 --adapter claude-code
```

Generates a dry-run plan of all file writes without touching disk.

## Architecture

```
agent.ts ─── build ──▶ OCI Artifact ─── push ──▶ Registry
                           │
                           ├── config blob (name, version, adapter)
                           ├── prompt layer (markdown)
                           ├── persona layer (canonical JSON)
                           ├── skills layer (tar+gzip)
                           ├── rules layer (tar+gzip)
                           ├── mcp layer (canonical JSON)
                           ├── subagents layer (canonical JSON)
                           ├── secrets layer (canonical JSON)
                           ├── knowledge layer (tar+gzip)
                           ├── surfaces layer (tar+gzip)
                           ├── instruction-tree layer (tar+gzip)
                           └── memory layer (tar+gzip)

Registry ─── pull ──▶ OCI Artifact ─── materialize ──▶ Runtime-native files
```

## Project Structure

```
stax/
├── apps/
│   ├── cli/                    # CLI application (Bun)
│   ├── web/                    # Web frontend (Astro)
│   └── docs/                   # Documentation (Astro)
├── packages/
│   ├── core/                   # Types, schemas, define helpers
│   ├── build/                  # Build + validate agent artifacts
│   ├── oci/                    # OCI manifest, push, pull, inspect
│   ├── resolve/                # Package dependency resolution + lockfile
│   ├── materialize/            # Materialize artifacts + install planning
│   ├── stax/                   # Unified package re-exports
│   ├── env/                    # Environment utilities
│   ├── config/                 # Shared build config
│   └── adapter/
│       ├── core/               # Adapter interface + defineAdapter
│       ├── claude-code/        # Claude Code adapter
│       ├── cursor/             # Cursor adapter
│       ├── codex/              # Codex adapter
│       ├── github-copilot/     # GitHub Copilot adapter
│       ├── windsurf/           # Windsurf adapter
│       ├── opencode/           # OpenCode adapter
│       └── openclaw/           # OpenClaw adapter
```

## Key Concepts

**Agent Definition** — A TypeScript file that declares an agent's identity (name, version, description), adapter, and paths to its layers (prompt, persona, skills, rules, MCP, etc.).

**Package Definition** — A reusable bundle of agent behaviors (skills, rules, MCP servers, knowledge) that can be composed into agents via dependency resolution.

**Adapter** — Maps canonical layers to a specific runtime's file format. Each adapter declares feature support levels (native, embedded, translated, unsupported).

**Layers** — Content-addressed blobs in the OCI artifact. JSON layers use canonical serialization (sorted keys, no whitespace). Directory layers use deterministic tar+gzip (sorted paths, zeroed timestamps).

**Materialization** — The process of converting an OCI artifact into runtime-native files. Handles template rendering, package merging, and adapter-specific file layout.

## Development

```bash
pnpm install          # Install dependencies
pnpm test             # Run all tests
pnpm check-types      # TypeScript type checking
pnpm lint             # Lint with oxlint
pnpm format           # Format with oxfmt
```

## Design Principles

- **Distribution only** — stax packages and distributes agent definitions. It does not execute, orchestrate, schedule, or host agents.
- **Deterministic builds** — Identical inputs always produce identical artifacts. Canonical JSON, sorted tar entries, zeroed timestamps.
- **OCI-native** — Artifacts are valid OCI images. Push to any OCI registry. Standard content-addressable storage.
- **Adapter fidelity** — Each adapter declares what it supports. Exact mode fails if the adapter can't faithfully reproduce. Best-effort mode emits warnings.
- **Composable packages** — Agents can depend on packages. Packages can depend on packages. Depth-first resolution with cycle detection and deduplication.
