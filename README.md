# stax

**The distribution standard for AI agents.**

stax defines how to describe, bundle, version, verify, and distribute an agent artifact as an [OCI artifact](https://github.com/opencontainers/image-spec). It does not run agents, orchestrate them, or manage their lifecycle — those are concerns for products built on top of this format.

stax is to agents what the OCI Image Spec is to containers, what `package.json` is to JavaScript packages, and what `Chart.yaml` is to Helm charts.

Conceptually:

- `stax build` is the agent equivalent of `docker build`
- `stax push` is the agent equivalent of `docker push`
- `stax pull` is the agent equivalent of `docker pull`

> **Spec status:** the authoritative normative specification lives in [`specs/`](./specs). If this README and the spec documents differ, follow `specs/`.
> Current `1.0.0` runtime-specific exact contracts are defined for Claude Code, Codex, and OpenClaw. Registry/discovery/install and hosted-platform flows are forward drafts, tracked in [99 — Roadmap and Draft Status](./specs/99-roadmap.md).

---

## Table of Contents

- [Why stax?](#why-stax)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
  - [Agent Manifest](#agent-manifest)
  - [Brain Layers](#brain-layers)
  - [Adapters](#adapters)
  - [Packages](#packages)
- [Quick Start](#quick-start)
- [Workspace Sources](#workspace-sources)
- [Agent Manifest Reference](#agent-manifest-reference)
- [Layer Specifications](#layer-specifications)
  - [Persona](#persona)
  - [Prompt](#prompt)
  - [Surfaces](#surfaces)
  - [MCP Servers](#mcp-servers)
  - [Skills](#skills)
  - [Rules](#rules)
  - [Knowledge](#knowledge)
  - [Memory](#memory)
  - [Secrets](#secrets)
- [CLI](#cli)
- [OCI Artifact Format](#oci-artifact-format)
- [Use Cases](#use-cases)
- [Design Principles](#design-principles)
- [Specification Documents](#specification-documents)
- [Contributing](#contributing)
- [License](#license)

---

## Why stax?

AI agents today are configured through scattered files — markdown prompts, JSON configs, MCP server definitions, rules files — with no standard way to version, share, promote, or distribute them. Every runtime (Claude Code, Codex, Cursor, Windsurf), hosted platform, and cloud environment has its own format. Moving an agent between tools means manual translation.

stax solves this by providing:

- **One format** to describe an agent's entire distributable brain — persona, prompts, tools, skills, rules, knowledge, memory, and named runtime surfaces
- **OCI-based distribution** using the same registries and tooling as container images (GHCR, Docker Hub, ECR, ACR)
- **Runtime adapters** that translate a single agent definition into runtime-specific formats or consumer-specific import surfaces
- **Runtime profiles** for portable non-secret runtime configuration such as OpenClaw profiles
- **Workspace source artifacts** for cacheable shared repo/workspace snapshots
- **Content-addressable storage** that deduplicates shared layers across agent variants and source snapshots

### The Boundary Principle

> The package carries **"what I am and what I need to start"** — intrinsic properties.
> Everything about **"how many, where, with what limits, alongside what, and how to update me"** is extrinsic and belongs to the consumer.

This is exactly how Docker images work: `ENTRYPOINT` and `ENV` are in the image. `--memory`, `--cpus`, `replicas`, and `resources.limits` are in `docker-compose.yml` or the Kubernetes pod spec. stax follows the same pattern for agents, whether they are consumed by local tools, hosted platforms, or cloud control planes.

For agents that need a real codebase or working tree, stax now prefers **separate cacheable workspace source artifacts** instead of embedding a Git repository in every agent artifact.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                      stax                        │
│              (distribution standard)             │
│                                                  │
│  TypeScript SDK  →  OCI Artifact  →  Registry    │
│                                                  │
│  defineAgent()      Typed layers     Push/Pull   │
│  definePackage()    Config blob      Inspect     │
│  definePersona()    Lockfile         Materialize │
└──────────────────┬───────────────────────────────┘
                   │
                   │  OCI artifact consumed by:
                   │
     ┌─────────────┼─────────────┬─────────────────┐
     ▼             ▼             ▼                 ▼
  Your           Agent         Cloud           Community
  Orchestrator   Platforms     Providers       Tools
  (custom        (E2B,         (AWS,           (CLI runners,
  systems)       Daytona,      Azure,          IDE plugins,
                 Modal)        GCP)            marketplaces)
```

---

## Core Concepts

### Agent Manifest

The `agent.ts` file is the root definition of an agent. It declares identity, brain layers, runtime hints, and dependencies using `defineAgent()`.

### Brain Layers

An agent's brain is composed of typed, independently versioned layers:

| Layer | Description | Mutable |
|-------|-------------|---------|
| **Persona** | Identity, personality, expertise, communication style | No |
| **Prompt** | System-level instructions in Markdown | No |
| **MCP** | Model Context Protocol server definitions | No |
| **Skills** | Reusable workflows that become slash commands | No |
| **Rules** | Behavioral constraints and coding standards | No |
| **Knowledge** | Static reference material (docs, APIs, guides) | No |
| **Memory** | Agent-accumulated learned context | **Yes** |
| **Surfaces** | Named Markdown documents for exact runtime file mapping | No |
| **Secrets** | Secret key declarations (names only, never values) | No |

### Adapters

Runtime-specific bridges that wrap agent definitions for each target.

Current `1.0.0` exact/runtime-specific docs exist for:

- `@stax/claude-code` — Claude Code (`@stax/claude` is a compatibility alias)
- `@stax/codex` — OpenAI Codex
- `@stax/openclaw` — OpenClaw workspaces
- `@stax/openclaw/profile` — OpenClaw runtime profiles
- `@stax/generic` — Custom or not-yet-standardized runtimes

Future adapters may target tools such as Cursor, Windsurf, and hosted agent platforms, but those contracts are not yet normative in `1.0.0`.

### Packages

Reusable configuration bundles — the npm packages of the agent world. A package can contain MCP servers, skills, rules, knowledge, surfaces, and secret declarations. Agents depend on packages. Packages depend on other packages. The ecosystem grows through composition.

### Runtime Profiles

Some runtimes need a separate user- or machine-scoped configuration artifact. stax models that explicitly with runtime profile artifacts such as `@stax/openclaw/profile`, instead of forcing runtime config into the agent brain.

### Workspace Sources

When many agents need the same repository or working tree, stax prefers a **separate source artifact** that is cached once and referenced by many agents:

- agent artifact = the brain
- source artifact = the code/workspace snapshot
- runtime profile = runtime-scoped config

This keeps agent artifacts small while making multi-agent setup fast and cache-friendly.

---

## Quick Start

### Initialize a new agent

```bash
stax init --agent
cd my-agent
```

This scaffolds:

```
my-agent/
├── agent.ts              # Agent manifest
├── SYSTEM_PROMPT.md      # System prompt
├── persona.ts            # Default persona
├── personas/             # Persona variants
│   ├── _base.ts
│   └── maya-chen.ts
├── mcp-servers.ts        # MCP server definitions
├── skills/               # Skill definitions
├── rules/                # Behavioral rules
├── knowledge/            # Reference material
├── memory/               # Seed memory (optional)
├── surfaces/             # Named runtime-facing documents (optional)
├── .staxignore           # Ignore patterns
└── stax.lock             # Resolved package digests
```

### Define your agent

```typescript
// agent.ts
import { defineAgent } from 'stax';
import claudeCode from '@stax/claude-code';

export default defineAgent({
  name: 'backend-engineer',
  version: '3.1.0',
  description: 'Senior backend engineer specializing in distributed systems',
  tags: ['backend', 'architecture', 'code-review'],

  adapter: claudeCode({
    model: 'claude-opus-4-1',
    modelParams: { temperature: 0.3 },
  }),

  persona: './personas/maya-chen.ts',
  prompt: './SYSTEM_PROMPT.md',
  mcp: './mcp-servers.ts',
  skills: './skills/',
  rules: './rules/',
  knowledge: './knowledge/',
  memory: './memory/',
  surfaces: './surfaces/',

  hints: {
    isolation: 'microvm',
    capabilities: {
      shell: true,
      network: {
        mode: 'restricted',
        allowlist: ['api.anthropic.com', 'api.github.com'],
      },
      filesystem: {
        workspace: '/workspace',
        writable: ['/workspace'],
        denyRead: ['**/.env', '**/*credentials*'],
      },
    },
  },

  secrets: [
    { key: 'ANTHROPIC_API_KEY', required: true, kind: 'api-key' },
    { key: 'GITHUB_TOKEN', required: true, kind: 'token' },
    { key: 'SLACK_WEBHOOK', required: false, kind: 'url' },
  ],

  workspaceSources: [
    {
      id: 'backend-repo',
      ref: 'ghcr.io/myorg/sources/backend@sha256:abcdef123456...',
      mountPath: '/workspace/backend',
      writable: true,
      required: true,
    },
  ],

  packages: [
    'ghcr.io/myorg/packages/github-workflow:2.0.0',
    'ghcr.io/myorg/packages/org-standards@sha256:0123456789abcdef...',
    './packages/local-team-overrides',
  ]
});
```

### Build and publish

```bash
# Build the OCI artifact
stax build

# Build a specific persona variant
stax build --persona maya-chen

# Build all persona variants
stax build --all-personas

# Push to a registry
stax push ghcr.io/myorg/agents/backend-engineer:3.1.0

# Pull from a registry
stax pull ghcr.io/myorg/agents/backend-engineer:3.1.0

# Inspect artifact metadata
stax inspect ghcr.io/myorg/agents/backend-engineer:3.1.0

# Build a cacheable source artifact from a repo snapshot
stax build-source ./repo --git-url https://github.com/myorg/backend.git --commit abc123

# Push the source artifact separately for reuse across many agents
stax push ghcr.io/myorg/sources/backend:abc123
```

---

## Workspace Sources

When an agent always works on a repository, do **not** embed the full Git repo inside the brain artifact.

Instead, publish a separate **workspace source artifact** and reference it from the agent manifest.

```typescript
workspaceSources: [
  {
    id: 'backend',
    ref: 'ghcr.io/acme/sources/backend@sha256:abc123...',
    mountPath: '/workspace/backend',
    writable: true,
    required: true,
  },
]
```

Why this is better:

- the source artifact is cached once by digest
- many agents can reuse the same source snapshot
- agent artifacts stay small and stable
- source and brain can be versioned independently

Use this for:

- shared GitHub repositories
- monorepo snapshots
- air-gapped/offline prepared source snapshots

---

## Agent Manifest Reference

The `defineAgent()` function accepts the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier (`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`) |
| `version` | `string` | Yes | Semantic version |
| `description` | `string` | Yes | Human-readable description |
| `author` | `string` | No | Author or organization name |
| `license` | `string` | No | License identifier |
| `url` | `string` | No | Project URL |
| `tags` | `string[]` | No | Discovery and categorization tags |
| `adapter` | `AdapterConfig` | Yes | Runtime adapter with model config |
| `adapterFallback` | `AdapterConfig[]` | No | Alternate adapter configs in descending preference |
| `persona` | `string` | No | Path to persona definition file |
| `prompt` | `string` | No | Path to system prompt Markdown file |
| `mcp` | `string` | No | Path to MCP server definitions file |
| `skills` | `string` | No | Path to skills directory |
| `rules` | `string` | No | Path to rules directory |
| `knowledge` | `string` | No | Path to knowledge directory |
| `memory` | `string` | No | Path to seed memory directory |
| `surfaces` | `string` | No | Path to surfaces directory |
| `hints` | `RuntimeHints` | No | Runtime capability recommendations |
| `secrets` | `SecretDeclaration[]` | No | Secret key declarations |
| `packages` | `PackageReference[]` | No | OCI references or local paths to packages |

---

## Layer Specifications

### Persona

Defines the agent's identity and behavioral philosophy. The persona schema uses flat top-level field groups for identity and behavioral philosophy:

```typescript
// personas/maya-chen.ts
import { definePersona } from 'stax';

export default definePersona({
  // Identity
  name: 'maya-chen',
  displayName: 'Maya Chen',
  role: 'Senior Backend Engineer',
  background: '10 years building distributed systems at scale.',
  expertise: {
    primary: ['Go', 'distributed systems', 'PostgreSQL'],
    secondary: ['Kubernetes', 'Terraform'],
    learning: ['Rust'],
  },

  // Behavioral philosophy
  personality: {
    traits: ['pragmatic', 'thorough', 'mentoring'],
    communicationStyle: 'direct',    // 'direct' | 'diplomatic' | 'academic' | 'casual' | 'formal'
    verbosity: 'concise',            // 'minimal' | 'concise' | 'balanced' | 'detailed' | 'verbose'
  },

  voice: {
    tone: 'Professional but warm. Uses concrete examples.',
    codeComments: 'minimal',         // 'none' | 'minimal' | 'moderate' | 'thorough'
    patterns: ['Starts with positives before suggestions', 'Uses "we" when proposing improvements'],
    avoid: ['Overly academic language', 'Unnecessary hedging'],
  },

  values: [
    'Correctness over speed',
    'Explicit over implicit',
    'Simplicity over cleverness',
  ],

  preferences: {
    testing: 'Table-driven tests, no mocks unless necessary.',
    errorHandling: 'Explicit error returns, no panic.',
  },

  boundaries: {
    willNot: ['Write code without tests', 'Skip error handling'],
    always: ['Consider backwards compatibility', 'Document breaking changes'],
    escalates: ['Security-sensitive changes', 'Database migrations'],
  },
});
```

**Persona inheritance** is an authoring pattern using TypeScript spread:

```typescript
import base from './_base.ts';

export default definePersona({
  ...base,
  name: 'maya-chen',
  displayName: 'Maya Chen',
  role: 'Senior Backend Engineer',
  expertise: { primary: ['Go', 'distributed systems'] },
});
```

**Prompt templating**: prompts can reference persona fields using `{{ persona.displayName }}`, `{{ persona.role }}`, etc. Array values render as comma-separated lists.

**Replication**: Different persona variants (e.g., Maya vs. Alex) share all layers except the persona JSON. OCI content-addressable storage deduplicates the shared layers automatically.

### Prompt

The system prompt is authored in Markdown and injected as the agent's primary instruction set:

```markdown
# Backend Engineer — System Prompt

You are a senior backend engineer. Your primary responsibilities are:

1. **Code Review** — Review pull requests for correctness, performance, and maintainability
2. **Architecture** — Design scalable system architectures
3. **Mentorship** — Help junior engineers grow through thoughtful feedback

## Principles

- Prefer composition over inheritance
- Design for failure — every external call can fail
- Write code that is easy to delete, not easy to extend
```

### Surfaces

Named Markdown documents whose file identity matters to a runtime. Unlike the single `prompt` layer, surfaces let stax represent runtimes that expect multiple distinct instruction files — such as OpenClaw's `AGENTS.md`, `SOUL.md`, `TOOLS.md`, etc.

```
surfaces/
├── instructions.md    # Core operating instructions → AGENTS.md, CLAUDE.md
├── persona.md         # Soul, tone, boundaries → SOUL.md
├── tools.md           # Tool guidance → TOOLS.md
├── identity.md        # Agent display identity → IDENTITY.md
├── user.md            # User profile → USER.md
├── heartbeat.md       # Heartbeat guidance → HEARTBEAT.md
└── bootstrap.md       # One-time bootstrap → BOOTSTRAP.md
```

All files are optional. A runtime may use only `prompt`, only `surfaces`, or both. When both exist, adapters define how they are merged or mapped.

### MCP Servers

Define which Model Context Protocol servers the agent can access:

```typescript
// mcp-servers.ts
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
        GITHUB_API_URL: 'https://api.github.com',
      },
    },
    analytics: {
      url: 'https://mcp.internal.company.com/analytics',
      transport: 'http',
      headers: { 'x-team': 'platform' },
      secrets: ['ANALYTICS_TOKEN'],
      description: 'Internal analytics platform',
    },
  },
});
```

Two transport types are supported:
- **Stdio** — local process spawned by the runtime (`command` + `args`, with optional `env` and `cwd`)
- **HTTP/SSE** — remote server accessed via URL (`url` + `transport: 'http' | 'sse'`, with optional `headers`)

Servers also support `enabledTools` / `disabledTools` arrays to control which tools are exposed, and `enabled: boolean` to toggle servers on/off.

### Skills

Reusable workflows that become slash commands at runtime. Each skill is a directory with a `SKILL.md` file:

```
skills/
├── fix-issue/
│   └── SKILL.md
├── review-pr/
│   ├── SKILL.md
│   └── templates/
│       └── review-checklist.md
└── deploy/
    └── SKILL.md
```

**SKILL.md format:**

```markdown
---
name: fix-issue
description: Fix a GitHub issue following team standards
allowed-tools:
  - Read
  - Grep
  - Edit
  - Bash(git *)
  - Bash(gh *)
model: claude-sonnet-4-1
user-invocable: true
argument-hint: <issue-number>
---

Fix GitHub issue $ARGUMENTS.

1. Read issue details with `gh issue view $ARGUMENTS`
2. Understand the codebase context
3. Implement the fix
4. Write tests
5. Create a PR referencing the issue
```

Supported variables in skill bodies: `$ARGUMENTS`, `$ARGUMENTS[N]` (positional), `${STAX_SKILL_DIR}`, `${STAX_WORKSPACE}`.

### Rules

Behavioral constraints stored as Markdown files with optional frontmatter:

```markdown
---
scope: always
description: TypeScript coding standards
---

# TypeScript Standards

- Use `camelCase` for variables and functions
- Use `PascalCase` for types and interfaces
- Always handle errors explicitly — no empty catch blocks
- Prefer `const` over `let`, never use `var`
- Use strict TypeScript — no `any` types without justification
```

**Scopes:**

| Scope | Behavior |
|-------|----------|
| `always` | Applied to every interaction |
| `glob` | Applied when working on files matching a pattern (e.g., `**/*.test.ts`) |
| `auto` | Runtime decides based on context |
| `manual` | Only applied when explicitly invoked |

### Knowledge

Static reference material the agent can consult — documentation, API schemas, architecture diagrams, style guides:

```
knowledge/
├── api-docs/
│   ├── rest-api.md
│   └── graphql-schema.graphql
├── architecture/
│   ├── system-overview.md
│   └── diagrams/
│       └── data-flow.mermaid
├── guides/
│   └── onboarding.md
└── reference/
    └── error-codes.json
```

Any text format is supported: Markdown, JSON, YAML, GraphQL, Mermaid, code files. The entire directory is packaged as a gzipped tarball layer.

An optional `knowledge.manifest.json` can provide metadata for indexing — titles, tags, source URLs, and chunking hints per file.

### Memory

The **only mutable layer** — context the agent accumulates over time. Unlike knowledge (author-provided, immutable), memory is agent-generated and updated at runtime.

```
memory/
├── decisions.md            # Past architectural decisions
├── patterns.md             # Learned codebase patterns
├── user-preferences.md     # Observed user conventions
├── project-context.md      # Project-specific context
└── memory.meta.json        # Optional snapshot metadata
```

An optional `memory.meta.json` provides snapshot metadata including `snapshotId`, `scope` (type: `agent | user | workspace | project | session`), `sourceArtifact`, `parentSnapshot`, and `createdAt`.

**Seed memory** can bootstrap an agent with initial context. Runtime updates follow one of three patterns:

1. **New manifest version** — rebuild with updated memory layer
2. **OCI Referrers API** — attach memory deltas as referrer artifacts
3. **External storage** — persist to a database or filesystem outside OCI

### Secrets

Agents declare **what secret keys they need**, never the values. The consumer (orchestrator, platform, CI/CD) is responsible for resolving, validating, and injecting actual values.

```typescript
secrets: [
  { key: 'ANTHROPIC_API_KEY', required: true, kind: 'api-key', description: 'Claude API access' },
  { key: 'GITHUB_TOKEN', required: true, kind: 'token', description: 'GitHub API for PRs and issues' },
  { key: 'SLACK_WEBHOOK', required: false, kind: 'url', description: 'Post notifications to Slack' },
]
```

Each declaration supports optional fields: `kind` (`'api-key' | 'token' | 'password' | 'certificate' | 'connection-string' | 'url' | 'opaque'`), `description`, and `exposeAs` (`{ env?: string; file?: string }`).

The OCI layer stores key names and metadata only — never secret values.

---

## CLI

### Commands

| Command | Description |
|---------|-------------|
| `stax init` | Scaffold a new agent or package project |
| `stax build` | Compile TypeScript definitions and assemble OCI layers |
| `stax validate` | Validate manifest and layers without building |
| `stax materialize` | Translate an artifact into runtime-native files |
| `stax push <ref>` | Push built artifact to an OCI registry |
| `stax pull <ref>` | Pull artifact from an OCI registry to local cache |
| `stax inspect <ref>` | Display artifact metadata, layers, and digests |
| `stax extract <ref>` | Extract canonical layers for debugging |
| `stax diff <a> <b>` | Compare two artifacts or local projects |
| `stax verify <ref>` | Verify signatures or attestations via OCI referrers |
| `stax login` | Authenticate with an OCI registry |

Discovery, install, promotion, and mirror commands beyond this baseline live in the forward draft set, especially [32 — Distribution CLI Operations](./specs/32-distribution-cli-operations.md).

### Build Options

```bash
# Standard build
stax build

# Build specific persona variant
stax build --persona maya-chen

# Build all persona variants
stax build --all-personas

# Dry run (validate and resolve without writing)
stax build --dry-run

# Refresh the lock file
stax build --refresh-lock

# Validate only (no artifact produced)
stax validate

# Materialize for a specific runtime
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --out ./output
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --adapter codex --out ./codex-output
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --json
```

### Configuration

Optional `stax.config.ts` for CLI defaults:

```typescript
export default {
  registry: 'ghcr.io/myorg/agents',
  defaultPersona: 'maya-chen',
  failOnLossyMaterialization: false,
};
```

### Build Artifacts

- **OCI artifact** stored in local cache at `~/.stax/cache/`
- **Lock file** `stax.lock` pinning resolved package digests (commit this to version control)

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Validation error (invalid manifest or layers) |
| `2` | Build error (compilation or assembly failure) |
| `3` | Registry error (auth, network, or push/pull failure) |
| `4` | Package resolution error (missing or incompatible dependency) |
| `5` | Materialization compatibility error |
| `6` | Signature / verification error |

---

## OCI Artifact Format

Agents are packaged as OCI artifacts using the [OCI Image Spec v1.1](https://github.com/opencontainers/image-spec/blob/main/manifest.md) artifact extension.

### Artifact Types

| Type | Media Type |
|------|-----------|
| Agent | `application/vnd.stax.agent.v1` |
| Package | `application/vnd.stax.package.v1` |
| Runtime profile | `application/vnd.stax.profile.v1` |
| Workspace source | `application/vnd.stax.source.v1` |

### Layer Media Types

| Layer | Media Type |
|-------|-----------|
| Persona | `application/vnd.stax.persona.v1+json` |
| Prompt | `application/vnd.stax.prompt.v1+markdown` |
| MCP | `application/vnd.stax.mcp.v1+json` |
| Skills | `application/vnd.stax.skills.v1.tar+gzip` |
| Rules | `application/vnd.stax.rules.v1.tar+gzip` |
| Knowledge | `application/vnd.stax.knowledge.v1.tar+gzip` |
| Memory | `application/vnd.stax.memory.v1.tar+gzip` |
| Surfaces | `application/vnd.stax.surfaces.v1.tar+gzip` |
| Secrets | `application/vnd.stax.secrets.v1+json` |
| Packages | `application/vnd.stax.packages.v1+json` |
| Source snapshot | `application/vnd.stax.source.snapshot.v1.tar+gzip` |

### Layer Ordering

Layers are ordered by change frequency (least → most frequent) to maximize OCI cache reuse:

1. Knowledge (largest, changes least)
2. Rules
3. Skills
4. MCP Servers
5. Secrets
6. Packages
7. Surfaces
8. System Prompt
9. Persona (varies per variant)
10. Memory (changes every session)

---

## Use Cases

### Solo Developer

Package your personal Claude Code agent for portability. Move between machines, back up your configuration, and version your agent's evolution over time.

### Organization Standards

Publish shared packages containing your org's coding standards, approved MCP servers, and common skills. Every team's agents depend on the same base packages, ensuring consistency.

### Persona Replication

Create multiple persona variants (different names, personalities, communication styles) that share the same skills, rules, knowledge, and MCP servers. OCI deduplication means only the persona JSON layer differs.

### Multi-Runtime Deployment

Author one agent definition and deploy it to Claude Code, Codex, and OpenClaw from the same canonical artifact. Each adapter translates the unified format into the runtime's native configuration.

### Community Ecosystem

Publish and consume reusable skill packs, rule sets, and knowledge bases. The package system enables a growing ecosystem of shared agent configurations.

### Shared Source Snapshots

When multiple agents work on the same repository, publish one source artifact and let all agents reference it through `workspaceSources`. Consumers can cache the source by digest and materialize many writable workspaces from the same cached base snapshot.

### CI/CD Pipeline

Automate agent builds and publishing in your CI/CD pipeline — lint, validate, build, and push on every merge to main:

```yaml
# .github/workflows/agent.yml
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: stax validate
      - run: stax build --all-personas
      - run: stax push ghcr.io/myorg/agents/backend-engineer:${{ github.sha }}
```

---

## Design Principles

1. **Packaging, not orchestration** — stax defines _what_ an agent is, not _how_ to run it. Orchestration, scaling, and lifecycle management belong to consumers.

2. **Content-addressable storage** — OCI deduplicates layers by digest. Persona variants sharing 8 of 9 layers store only one copy of the shared content.

3. **Composition over inheritance** — agents compose packages; packages compose other packages. No inheritance hierarchies, just flat dependency resolution with merge strategies.

4. **TypeScript-first authoring** — definitions are written in TypeScript for type safety and IDE support, compiled to JSON for OCI layers.

5. **Declarative brain content** — prompts, rules, knowledge, and skills are plain Markdown and directory structures. No DSLs, no proprietary formats.

6. **Runtime-agnostic portability** — the same agent artifact works with any supported runtime through adapter translation.

7. **Separation of concerns** — secrets declare needs (key names), not values. Hints recommend capabilities, not enforce them. The consumer decides how to fulfill requirements.

---

## Specification Documents

The complete specification is maintained in the [`specs/`](./specs/) directory:

- Specs `00`–`22` define the current `1.0.0` core and runtime-specific surface.
- Specs `23`–`32` are forward design drafts and are not part of `1.0.0` conformance.
- [99 — Roadmap and Draft Status](./specs/99-roadmap.md) is the status index for what is current versus draft.

| Spec | Document | Description |
|------|----------|-------------|
| 00 | [Overview](./specs/00-overview.md) | Purpose, scope, and architecture |
| 01 | [Agent Manifest](./specs/01-agent-manifest.md) | `defineAgent()` format |
| 02 | [OCI Artifact Format](./specs/02-oci-artifact-format.md) | OCI manifest structure and media types |
| 03 | [Layers](./specs/03-layers.md) | All layer types and ordering |
| 04 | [Persona](./specs/04-persona.md) | Persona format and replication |
| 05 | [Packages](./specs/05-packages.md) | Shared configuration bundles |
| 16 | [Surfaces](./specs/16-surfaces.md) | Named prompt/instruction documents for exact runtime file mapping |
| 06 | [MCP](./specs/06-mcp.md) | MCP server definitions |
| 07 | [Skills](./specs/07-skills.md) | Skill packaging format |
| 08 | [Rules](./specs/08-rules.md) | Behavioral rules |
| 09 | [Knowledge](./specs/09-knowledge.md) | Static reference material |
| 10 | [Memory](./specs/10-memory.md) | Mutable memory layer |
| 11 | [Secrets](./specs/11-secrets.md) | Secret requirement declarations |
| 12 | [Adapters](./specs/12-adapters.md) | Runtime-specific adapters |
| 13 | [CLI](./specs/13-cli.md) | CLI tool specification |
| 14 | [Use Cases](./specs/14-use-cases.md) | Real-world usage scenarios |
| 15 | [Materialization](./specs/15-materialization.md) | Consumer contract for translating artifacts to runtime-native files |
| 17 | [Runtime File Contracts](./specs/17-runtime-file-contracts.md) | Exact file ownership and target mappings for each runtime |
| 18 | [Adapter: `@stax/claude-code`](./specs/18-adapter-claude-code.md) | Exact Claude Code adapter contract |
| 19 | [Adapter: `@stax/openclaw`](./specs/19-adapter-openclaw.md) | Exact OpenClaw workspace adapter contract |
| 20 | [Adapter: `@stax/codex`](./specs/20-adapter-codex.md) | Exact Codex adapter contract |
| 21 | [Profile: `@stax/openclaw/profile`](./specs/21-openclaw-profile.md) | Portable OpenClaw runtime-profile artifact |
| 22 | [Workspace Sources](./specs/22-workspace-sources.md) | Cacheable source artifacts and agent references for shared Git/workspace snapshots |
| 23 | [Registry, Discovery, and Install](./specs/23-registry-discovery-install.md) | Draft design for search, install plans, and registry discovery |
| 24 | [Trust, Policy, and Attestations](./specs/24-trust-policy-attestations.md) | Draft design for signatures, approvals, provenance, and policy gates |
| 25 | [Hosted Platform Adapter Contract](./specs/25-hosted-platform-adapter-contract.md) | Draft design for hosted platform imports and non-filesystem consumers |
| 26 | [Compatibility and Capability Metadata](./specs/26-compatibility-and-capability-metadata.md) | Draft design for compatibility preflight metadata |
| 27 | [Package and Marketplace Metadata](./specs/27-package-and-marketplace-metadata.md) | Draft design for richer ecosystem metadata |
| 28 | [Conformance and Certification](./specs/28-conformance-and-certification.md) | Draft design for interoperability testing |
| 29 | [Source Governance and Provenance](./specs/29-source-governance-and-provenance.md) | Draft design for source snapshot governance |
| 30 | [Package and MCP Safety Policy](./specs/30-package-and-mcp-safety-policy.md) | Draft design for package and MCP safety controls |
| 31 | [Registry Lifecycle, Promotion, and Mirroring](./specs/31-registry-lifecycle-and-mirroring.md) | Draft design for promotion, mirroring, and lifecycle metadata |
| 32 | [Distribution CLI Operations](./specs/32-distribution-cli-operations.md) | Draft design for future CLI distribution workflows |
| 99 | [Roadmap and Draft Status](./specs/99-roadmap.md) | What is core `1.0.0`, what is draft, and what to implement first |

---

## Contributing

stax is currently in the specification design phase. Contributions to the spec are welcome — open an issue or pull request to discuss proposed changes.

---

## License

See [LICENSE](./LICENSE) for details.
